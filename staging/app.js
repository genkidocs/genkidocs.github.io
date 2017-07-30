(function(window){
    var sys_state = "view";
    var card_template;
    var branch_template;
    var tree_template;
    var md = window.markdownit({
        html:true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(lang, str, true).value +
                    '</code></pre>';
            } catch (__) {}
            }
            return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        }
    });
    var resizeTextarea = function(e) {
        $(e).css({'height':'auto','overflow':'hidden'}).height(e.scrollHeight);
    }    
    var hideEls = function(els){
        els.map(function(el){
            $(el).addClass("sys_hide");
        })
    };
    var showEls = function(els){
        els.map(function(el){
            $(el).removeClass("sys_hide");
        })
    }   
    var switchToView = function(){
        hideEls([".card.active .edit",".card.active .view"]);
        var _in = $(".card.active .edit").val();
        $(".card.active .edit").attr("value",_in);
        var _out = md.render(_in).trim();
        var html = $(".card.active .view").html().trim();
        if(_out === html){           
        }else{
            $(".card.active .view").html(_out);
        }        
        showEls([".card.active .view"]);                    
        sys_state = "view";    
        scrollToActiveCard();    
    } 
    var switchToEdit = function(){
        hideEls([".card.active .edit",".card.active .view"]);
        showEls([".card.active .edit"]);
        $(".card.active .edit").focus();
        sys_state = "edit"; 
        scrollToActiveCard();       
    }   
    var setAppBody = function(trees){
            $("#app-body").html(trees);
            $("textarea").each(function(){
                var val = $(this).attr("value");
                $(this).val(val);
            });
            scrollToActiveCard();
    };
    var handleFileLoad = function(evt) {
        var file = evt.target.files[0]; // FileList object    
        var reader = new FileReader();
        reader.onload = function(e){
            var treeHtml = e.target.result;
            setAppBody(treeHtml);
        }
        reader.readAsText(file);
    }    
    var scrollToActiveCard = function(){
        var activeCard = $(".card.active");
        var branch = $(".card.active").parents(".branch");
        var scrollSpeed = .6;
        TweenLite.to(window, scrollSpeed, {scrollTo:{x:activeCard}});
        TweenLite.to(branch, scrollSpeed, {scrollTo:{y:activeCard}});
    }  
    var registerHandlers = function(){

        $('body').on('input','textarea', function () {
            resizeTextarea(this);
        });

        $("#files").on("change",handleFileLoad);

        $('body').on("click",".card",function(){
            switch(sys_state){
                case "edit":
                    return;
            }  
            $(".card.active").removeClass("active"); 
            $(this).addClass("active");
            scrollToActiveCard();
        })

        //Add card above
        Mousetrap.bindGlobal(['command+up','ctrl+up'],function(e){            
            var id = uuid();            
            var parentId = $(".card.active").attr("data-parent");
            var cardHtml = card_template({
                id:id,
                parent:parentId
            });             
            switch(sys_state){
                case "edit":
                    switchToView();
                break;
            }            
            $(".card.active").before(cardHtml);      
            $(".card.active").removeClass("active");
            $("#"+id).addClass("active");
            switchToEdit();
            return false;
        })

        //Move card above
        Mousetrap.bindGlobal(['command+shift+up','ctrl+shift+up'],function(e){
            var card = $(".card.active");
            var card_above = $(card).prev(".card");
            if(card_above.length > 0){
                switch(sys_state){
                    case "edit":
                        switchToView();
                    break;
                }
                $(card_above).before($(card));
                scrollToActiveCard();
            }                        
            return false;
        })

        //Select card above
        Mousetrap.bind(['up'],function(e){
            var card_above = $(".card.active").prev(".card");
            if(card_above.length > 0){
                switch(sys_state){
                    case "edit":
                        switchToView();
                    break;
                }
                $(".card.active").removeClass("active");
                $(card_above).addClass("active");
                scrollToActiveCard();
            }                        
            return false;
        })

        //Delete card
        Mousetrap.bind(['del'],function(e){
            var cards = $(".card").length;            
            if(cards == 1){
                return false;
            }
            var card = $(".card.active");
            var card_above = $(card).prev(".card");
            var card_below = $(card).next(".card");
            var parentId = $(card).attr("data-parent");
            var branch = $(card).parents(".branch");
            var cardsInBranch = $(branch).find(".card").length;            
            var card_to_select;
            switch(sys_state){
                case "edit":
                    switchToView();
                break;
            }

            if(card_above.length > 0){
                card_to_select = card_above;
            }else if(card_below.length > 0){
                card_to_select = card_below;
            }else if(cardsInBranch == 1){
                var parent_card = $("#"+parentId);
                card_to_select = parent_card;
                card = branch;
            }                       
            $(card).remove();
            $(card_to_select).addClass("active");
            scrollToActiveCard();
            return false;
        })
        
        //Add card below
        Mousetrap.bindGlobal(['command+down','ctrl+down'],function(e){
            var id = uuid();
            var parentId = $(".card.active").attr("data-parent");
            var cardHtml = card_template({
                id:id,
                parent:parentId
            });             
            switch(sys_state){
                case "edit":
                    switchToView();
                break;
            }            
            $(".card.active").after(cardHtml);      
            $(".card.active").removeClass("active");
            $("#"+id).addClass("active");
            switchToEdit();
            return false;
        })

        //Add card to the right
        Mousetrap.bindGlobal(['command+right','ctrl+right'],function(e){          
            switch(sys_state){
                case "edit":
                    switchToView();
                break;
            }
            var card = $(".card.active");
            var parentId = $(card).attr("id");
            if(!parentId){
                parentId = uuid();
                $(card).attr("id",parentId);
            }    
            var id = uuid();
            var cardHtml = card_template({
                id:id,
                parent:parentId
            });               
            var parentBranch = $(card).parents(".branch");        
            var branchRight = $(parentBranch).next(".branch");            
            var cardNew = $(cardHtml);
            if(branchRight.length == 0){
                var branchHtml = branch_template();
                var branchNew = $(branchHtml);                
                $(branchNew).find(".branch_padding").first().after(cardNew);
                $(parentBranch).after(branchNew);
                $(card).removeClass("active");
                $(cardNew).addClass("active");
                switchToEdit();
            }else{
                var lastCard = $(branchRight).find(".card[data-parent='"+parentId+"']").last();
                if(lastCard.length > 0){
                    $(lastCard).after(cardNew);
                }else{
                    $(branchRight).find(".branch_padding").last().before(cardNew);
                }
                $(card).removeClass("active");
                $(cardNew).addClass("active");
                switchToEdit();
            }
            return false;
        })

        //Select card below
        Mousetrap.bind(['down'],function(e){
            var card_below = $(".card.active").next(".card");
            if(card_below.length > 0){
                switch(sys_state){
                    case "edit":
                        switchToView();
                    break;
                }
                $(".card.active").removeClass("active");
                $(card_below).addClass("active");
                scrollToActiveCard();
            }                        
            return false;
        })

        //Select card to the right
        Mousetrap.bind(['right'],function(e){
            var activeCard = $(".card.active"); 
            var parentID = $(activeCard).attr("id")
            var branch = $(activeCard).parents(".branch").next(".branch");
            if(branch.length > 0){
                var firstCard = $(branch).find(".card").first(); 
                var card = $(branch).find(".card[data-parent='"+parentID+"']").first();
                if(card.length > 0){
                    $(activeCard).removeClass("active");
                    $(card).addClass("active");
                    scrollToActiveCard();
                }else if(firstCard.length > 0){
                    $(activeCard).removeClass("active");
                    $(firstCard).addClass("active");
                    scrollToActiveCard();                    
                }
            }                      
            return false;
        })

        //Select card to the left
        Mousetrap.bind(['left'],function(e){
            var activeCard = $(".card.active"); 
            var parentID = $(activeCard).attr("data-parent")
            var branch = $(activeCard).parents(".branch").next(".branch");
            if(parentID){
                var card = $("#"+parentID);
                $(activeCard).removeClass("active");
                $(card).addClass("active");
                scrollToActiveCard();
            }                      
            return false;
        })
        
        //Move card below
        Mousetrap.bind(['command+shift+down','ctrl+shift+down'],function(e){
            var card = $(".card.active");
            var card_below = $(card).next(".card");
            if(card_below.length > 0){
                switch(sys_state){
                    case "edit":
                        switchToView();
                    break;
                }
                $(card_below).after($(card));
                scrollToActiveCard();
            }                        
            return false;
        })

        //View | Edit active card
        Mousetrap.bindGlobal(['command+enter', 'ctrl+enter'], function(e) {                        
            switch(sys_state){
                case "view":
                    switchToEdit();
                break;
                case "edit":
                    switchToView();
                break;
            }
            return false;
        });

        //Save tree
        Mousetrap.bind(['command+s', 'ctrl+s'], function(e) {                        
            var treeHtml = $("#app-body").html();
            var filename = "tree_"+moment().toISOString()+".genkidoc";
            console.log("Saving : " + filename);
            var blob = new Blob([treeHtml], {type: "text/plain;charset=utf-8"});
            saveAs(blob, filename);
            return false;
        }); 

        //Load tree
        Mousetrap.bind(['command+l', 'ctrl+l'], function(e) {                        
            $("#files").click();
            return false;
        });

        //Create new tree       
        Mousetrap.bind(['shift+n'], function(e) {                        
            var id = uuid();
            var treeHtml = tree_template({
                id:id
            });            
            $("#app-body").html(treeHtml);
            return false;
        });
                
    }

    var loadHelp = function(){
        $.ajax({
            url: "sampledocs/genki_help.genkidoc",
        })
        .done(function( help ) {
            setAppBody(help);
        });        
    }
    var boot = function(){
        if(!card_template){
            var source   = $("#card_template").html();
            card_template = Handlebars.compile(source);
        }        
        if(!branch_template){
            var source   = $("#branch_template").html();
            branch_template = Handlebars.compile(source);
        }
        if(!tree_template){
            var source   = $("#tree_template").html();
            tree_template = Handlebars.compile(source);
        }                                
        registerHandlers();
        loadHelp();
    }

    $(document).ready(function(){
        boot();
    });
}(window))
