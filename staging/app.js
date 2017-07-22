(function(window){
    var sys_state = "view";
    var card_template;
    var md = window.markdownit({
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
    } 
    var switchToEdit = function(){
        hideEls([".card.active .edit",".card.active .view"]);
        showEls([".card.active .edit"]);
        $(".card.active .edit").focus();
        sys_state = "edit";        
    }   
    var handleFileLoad = function(evt) {
        var file = evt.target.files[0]; // FileList object    
        var reader = new FileReader();
        reader.onload = function(e){
            var treeHtml = e.target.result;
            $("#app-body").html(treeHtml);
            $("textarea").each(function(){
                var val = $(this).attr("value");
                $(this).val(val);
            })
        }
        reader.readAsText(file);
    }      
    var registerHandlers = function(){

        $('body').on('input','textarea', function () {
            resizeTextarea(this);
        });

        $("#files").on("change",handleFileLoad);

        //Add card above
        Mousetrap.bindGlobal(['command+up','ctrl+up'],function(e){            
            var id = uuid();
            var cardHtml = card_template({
                id:id
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
            }                        
            return false;
        })

        //Delete card
        Mousetrap.bindGlobal(['del'],function(e){
            var cards = $(".card").length;            
            if(cards == 1){
                return false;
            }
            var card = $(".card.active");
            var card_above = $(card).prev(".card");
            var card_below = $(card).next(".card");
            if(card_above.length > 0){
                switch(sys_state){
                    case "edit":
                        switchToView();
                    break;
                }
                $(card).removeClass("active");
                $(card_above).addClass("active");                
            }else if(card_below.length > 0){
                switch(sys_state){
                    case "edit":
                        switchToView();
                    break;
                }
                $(card).removeClass("active");
                $(card_below).addClass("active");
            }                       
            $(card).remove();
            return false;
        })
        
        //Add card below
        Mousetrap.bindGlobal(['command+down','ctrl+down'],function(e){
            var id = uuid();
            var cardHtml = card_template({
                id:id
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
    }
    var resizeBranches = function(){
        var branchHeight = $("body").outerHeight() - $("#app-header").outerHeight();        
        $(".branch").css("min-height",branchHeight);
        $(".branch").css("max-height",branchHeight);
    }
    var registerResizeHandlers = function(){
        resizeBranches();
    }
    var boot = function(){
        if(!card_template){
            var source   = $("#card_template").html();
            card_template = Handlebars.compile(source);
        }        
        registerResizeHandlers();
        registerHandlers();
    }

    $(document).ready(function(){
        boot();
    });
}(window))  

