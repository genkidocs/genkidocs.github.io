(function(window){
    var sys_state = "view";
    localStorage.setItem("sys_state",sys_state);
    var card_template;
    var branch_template;
    var tree_template;
    var file_template;
    var prev_card;
    var scrollSpeed = .6;    
    var db = window.db;    
    var md = window.markdownit({
        html:true,
        linkify:true,
        typographer:true,
        highlight:function (str, lang) {
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
        localStorage.setItem("sys_state",sys_state);
        scrollToActiveCard();  
        saveToDb();  
    } 
    var switchToEdit = function(){
        hideEls([".card.active .edit",".card.active .view"]);
        showEls([".card.active .edit"]);
        $(".card.active .edit").focus();
        sys_state = "edit"; 
        localStorage.setItem("sys_state",sys_state);
        scrollToActiveCard();       
    }   
    var setAppBody = function(treeHtml){
            
            var tree = $(treeHtml)
            $("#doc_name").val($(tree).attr("data-name"))
            $("#doc_name").attr("data-doc-id",$(tree).attr("id"));
            $("#app-body").html("");
            $("#app-body").append(tree)
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
    var highlight = function(cards){
        $(".card.highlight").removeClass("highlight");
        cards.map(function(card){
            $(card).addClass("highlight");
        })
    }
    var branchScroll = function(cards){
        var activeCardId = $(".card.active").attr("id");
        var prevCardParentId = $(prev_card).attr("data-parent");
        var isParent = (prevCardParentId == activeCardId);        
        if(isParent){
            return;
        };
        cards.map(function(_card){
            var card = $(_card)
            var branch = $(card).parents(".branch");
            var branchHeight = $(branch).outerHeight();
            var cardHeight = $(card).outerHeight();
            var offsetHeight = branchHeight/2 - cardHeight/2;
            TweenLite.to(branch, scrollSpeed, {scrollTo:{y:card,offsetY:offsetHeight}});            
        })
    }

    var highlightActiveThread = function(){
        var activeCard = $(".card.active");
        var activeCardID = $(activeCard).attr("id");
        var ancestors = [];
        var descendants = [];
        var ancestorString = $(activeCard).attr("data-ancestors") || "";
        if(ancestorString){
            ancestorString.split("_").map(function(ancestorID){
                if(!ancestorID) return;
                ancestors.push($("#"+ancestorID))
            })
        }
        $(".card[data-ancestors*='"+activeCardID+"']").each(function(){
            descendants.push($(this));
        })
        //BranchScroll all Ancestors and first descendant in every branch
        var branchScrollList = [];
        var firstDescendantInEachBranch = [];
        $(".branch").each(function(){
            var card = $(this).find(".card[data-ancestors*='"+activeCardID+"']").first();
            if(card.length > 0){
                firstDescendantInEachBranch.push(card);
            }    
        })
        branchScrollList = branchScrollList.concat(ancestors).concat(firstDescendantInEachBranch);
        branchScroll(branchScrollList);
        
        // Highlight all ancestors, active card and descendants
        var highlightList = [];
        highlightList.push(activeCard);
        highlightList = highlightList.concat(ancestors).concat(descendants);
        highlight(highlightList);
    }
    var scrollToActiveCard = function(){
        var activeCard = $(".card.active");
        var branch = $(".card.active").parents(".branch");        
        var branchHeight = $(branch).outerHeight();
        var cardHeight = $(activeCard).outerHeight();
        var offsetHeight = branchHeight/2 - cardHeight/2;

        var windowWidth = $(window).outerWidth();
        var cardWidth = $(activeCard).outerWidth();
        var offsetWidth = windowWidth/2 - cardWidth/2;

        TweenLite.to(window, scrollSpeed, {scrollTo:{x:activeCard,offsetX:offsetWidth}});
        TweenLite.to(branch, scrollSpeed, {scrollTo:{y:activeCard,offsetY:offsetHeight}});
        highlightActiveThread();
        saveToDb();
    }  

    var insertAtCaret = function(txtarea, text){            
            var scrollPos = txtarea.scrollTop;
            var caretPos = txtarea.selectionStart;
            var front = (txtarea.value).substring(0, caretPos);
            var back = (txtarea.value).substring(txtarea.selectionEnd, txtarea.value.length);
            txtarea.value = front + text + back;
            caretPos = caretPos + text.length;
            txtarea.selectionStart = caretPos;
            txtarea.selectionEnd = caretPos;
            txtarea.focus();
            txtarea.scrollTop = scrollPos;
        }
        var insertBeforeSelection = function(txtarea, text){            
            var scrollPos = txtarea.scrollTop;
            var caretPos = txtarea.selectionStart;
            var front = (txtarea.value).substring(0, caretPos);
            var back = (txtarea.value).substring(caretPos, txtarea.value.length);
            txtarea.value = front + text + back;
            txtarea.focus();
            txtarea.scrollTop = scrollPos;
        }
        var insertAfterSelection = function(txtarea, text){            
            var scrollPos = txtarea.scrollTop;            
            var caretPos = txtarea.selectionEnd;
            var front = (txtarea.value).substring(0, caretPos);
            var back = (txtarea.value).substring(caretPos, txtarea.value.length);
            txtarea.value = front + text + back;
            txtarea.focus();
            txtarea.scrollTop = scrollPos;
        }

    var MoveCaret = function(txtarea, offset){    
            console.log("Move caret : " + offset);        
            var scrollPos = txtarea.scrollTop;
            var caretPos = txtarea.selectionStart;
            caretPos = caretPos + offset;
            txtarea.selectionStart = caretPos;
            txtarea.selectionEnd = caretPos;
            txtarea.focus();
            txtarea.scrollTop = scrollPos;
        }

    var closeFileManager = function(){
        $("#filePicker").css({
            "top":"-100%"
        });
        sys_state = "view"
        localStorage.setItem("sys_state",sys_state)
    }
        var registerHandlers = function(){

        $('body').on('input','textarea', function () {
            resizeTextarea(this);
        });

        $("#files").on("change",handleFileLoad);

        $('body').on("keyup","#doc_name",function(){
            saveToDb();
        })

        $('body').on("keyup","textarea",function(){
            saveToDb();
        })

        $("body").on("click",".file",function(){
            var docId = $(this).attr("id").replace("file_","").trim();
            db.docs.get(docId).then(function(doc){
                loadDoc(doc);
                closeFileManager();
            });
        });

        $('body').on("click",".card",function(){
            switch(sys_state){
                case "edit":
                    return;
            }  
            prev_card =  $(".card.active");
            $(".card.active").removeClass("active"); 
            $(this).addClass("active");
            scrollToActiveCard();
        })

        //Add card above
        Mousetrap.bindGlobal(['alt+up'],function(e){            
            var id = uuid();            
            var parentId = $(".card.active").attr("data-parent") || "";
            var ancestors = ""
            if(parentId){
                ancestors = $("#"+parentId).attr("data-ancestors");
            }                         
            var cardHtml = card_template({
                id:id,
                parent:parentId,
                ancestors:ancestors+"_"+parentId
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
        Mousetrap.bindGlobal(['alt+shift+up'],function(e){
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
                prev_card = $(".card.active");
                $(".card.active").removeClass("active");
                $(card_above).addClass("active");
                scrollToActiveCard();
            }                        
            return false;
        })

        //Delete card
        Mousetrap.bind(['alt+backspace'],function(e){
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
                if(parent_card.length > 0){
                    card_to_select = parent_card;
                    card = branch;
                }else{
                    card_to_select = card;
                    card = null;                    
                }
            }                       
            $(card).remove();
            $(card_to_select).addClass("active");
            scrollToActiveCard();
            return false;
        })
        
        //Add card below
        Mousetrap.bindGlobal(['alt+down'],function(e){
            var id = uuid();
            var parentId = $(".card.active").attr("data-parent") || "";
            var ancestors = ""
            if(parentId){
                ancestors = $("#"+parentId).attr("data-ancestors");
            }            
            var cardHtml = card_template({
                id:id,
                parent:parentId,
                ancestors:ancestors+"_"+parentId
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
        Mousetrap.bindGlobal(['alt+right'],function(e){          
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
            var ancestors = $(card).attr("data-ancestors");            
            var cardHtml = card_template({
                id:id,
                parent:parentId,
                ancestors:ancestors+"_"+parentId
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
                prev_card = $(".card.active");
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

            var prevCardParentId = $(prev_card).attr("data-parent");
            var activeCardId = $(activeCard).attr("id");
            var isChild = (prevCardParentId == activeCardId);

            if(isChild){
                    var card_to_select = prev_card;
                    prev_card = $(".card.active");
                    $(activeCard).removeClass("active");
                    $(card_to_select).addClass("active");
                    scrollToActiveCard();                
                    return;
            }

            if(branch.length > 0){
                var firstCard = $(branch).find(".card").first(); 
                var card = $(branch).find(".card[data-parent='"+parentID+"']").first();
                if(card.length > 0){
                    prev_card = $(".card.active");
                    $(activeCard).removeClass("active");
                    $(card).addClass("active");
                    scrollToActiveCard();
                }else if(firstCard.length > 0){
                    prev_card = $(".card.active");
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
                prev_card = $(".card.active");
                $(activeCard).removeClass("active");
                $(card).addClass("active");
                scrollToActiveCard();
            }                      
            return false;
        })
        
        //Move card below
        Mousetrap.bind(['alt+shift+down'],function(e){
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
        Mousetrap.bindGlobal(['alt+enter'], function(e) {                        
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
        Mousetrap.bind(['alt+s'], function(e) {                        
            var treeHtml = $("#app-body").html();
            var filename = "tree_"+moment().toISOString()+".genkidoc";
            console.log("Saving : " + filename);
            var blob = new Blob([treeHtml], {type: "text/plain;charset=utf-8"});
            saveAs(blob, filename);
            return false;
        }); 

        //Create new tree       
        Mousetrap.bind(['alt+n'], function(e) {                        
            var treeId = uuid();
            var treeName = "Untitled Document";
            var startTreeHtml = tree_template({
                id:treeId,
                name:treeName
            });
            var startTree = $(startTreeHtml);
            $("#doc_name").val(treeName);
            $("#doc_name").attr("data-doc-id",treeId);


            var cardId = uuid();
            var startMd = "## Start here...";            
            var cardRender = md.render(startMd).trim();
            var startCardHtml = card_template({
                id:cardId,
                parent:"",
                ancestors:"",
                md:startMd,
                render:cardRender
            });  
            var startCard = $(startCardHtml);
            
            var startBranchHtml = branch_template();
            var startBranch = $(startBranchHtml);                
            $(startBranch).find(".branch_padding").first().after(startCard);
            $(startTree).find(".tree_padding").last().before(startBranch);
            
            
            $("#app-body").html("");
            $("#app-body").append(startTree);
            $("#"+cardId).addClass("active");
            scrollToActiveCard();
            return false;
        });

        //Open FileManager
        Mousetrap.bindGlobal(['alt+t'], function(e) {                        
            switch(sys_state){
                case "view":
                    db.docs.toArray().then(function(docs){                        
                        var filePickerHtml = "";
                        docs.map(function(doc){
                            var fileHtml = file_template(doc);
                            filePickerHtml += fileHtml;
                        })

                        $("#filePicker").html("");
                        $("#filePicker").append(filePickerHtml);
                        var activeDocId = $("#doc_name").attr("data-doc-id");
                        $("#file_"+activeDocId).addClass("active");

                        var top = $(window).outerHeight()/2 - $("#filePicker").outerHeight()/2;
                        var left = $(window).outerWidth()/2 - $("#filePicker").outerWidth()/2;
                        $("#filePicker").css({
                            "top":top,
                            "left":left
                        });
                        sys_state = "filePicker";
                        localStorage.setItem("sys_state",sys_state);    
                        $("#filePicker").focus();                
                    })
                return false;              
                default:
                    closeFileManager();
                return false;  
            }            
        });

        //Edit short cuts
        //insert image       
        Mousetrap.bindGlobal(['alt+i'], function(e) {                        
            switch(sys_state){
                case "edit":
                    var textArea = $(".card.active .edit")[0];
                    insertAtCaret(textArea,"![]()");
                    MoveCaret(textArea,-1);
                return false;                
            }            
        });
        Mousetrap.bindGlobal(['alt+l'], function(e) {                        
            switch(sys_state){
                case "edit":
                    var textArea = $(".card.active .edit")[0];
                    var selectionLength = textArea.selectionEnd - textArea.selectionStart;
                    //console.log("Selection Length : " + selectionLength);
                    var offset = selectionLength + 4 + 3;
                    insertBeforeSelection(textArea,"<a target=\"_blank\" href=\"\" >");
                    insertAfterSelection(textArea,"</a>");
                    MoveCaret(textArea,-offset);
                return false;                
                case "view":
                    $("#files").click();
                return false;
            }            
        });  
    }
    
    var saveToDb = function(){        
        var docName = $("#doc_name").val();
        var docId = $("#doc_name").attr("data-doc-id");
        var activeCardId = $(".card.active").attr("id");
        var cards = [];
        var ancestorMap = {};
        if(!docId){
            //console.log("No Doc ID found")
            docId = uuid();
            $("#doc_name").attr("data-doc-id",docId);
        }
        //console.log("Name : " + docName);
        //console.log("Id : " + docId);
        var branchNo = 0;
        $(".branch").each(function(){
            //console.log("\n---\nBranch No : " + branchNo);
            var cardNo = 0;
            $(this).find(".card").each(function(){
                //console.log("\n###")
                var md = $(this).find(".edit").val();
                var id = $(this).attr("id");
                var parentId = $(this).attr("data-parent");
                var ancestors = $(this).attr("data-ancestors");
                if(parentId){
                    //console.log("Has parent");
                    if((/undefined/g).test(ancestors)){
                        //console.log("Need to fix ancestors");
                        ancestors = ancestorMap[parentId] + "_" + parentId;
                    }else{
                        //console.log("Don't need to fix ancestors");
                    }
                }else{
                    //console.log("Has no parent");
                    ancestors = "";
                }
                //console.log("Card No : " + cardNo);
                //console.log("Card Id : " + id);                
                //console.log("Parent : " + parentId);
                //console.log("Ancestors : " + ancestors);
                ancestorMap[id] = ancestors;
                var card = {
                    branchNo:branchNo,
                    cardNo : cardNo,
                    id:id,
                    parentId:parentId,
                    ancestors:ancestors,
                    md:md
                }
                cards.push(card);
                cardNo++;
            })
            branchNo++;
        })
        var doc = {
            name:docName,
            id:docId,
            cards:cards,
            activeCardId:activeCardId,
            lastModified:moment().toISOString()
        }
        //console.dir(doc);
        db.transaction("rw",db.docs,db.meta,function(){
            db.docs.put(doc).then(function(){
                //console.log("Docs updated!");            
            });
            db.meta.put({
                "name":"activeDocId",
                "value":doc["id"],
                lastModified:moment().toISOString()
            }).then(function(){
                //console.log("Meta updated!");
            })               

        }).then(function(){
            //console.log("Db updated!");
        }).catch(function (error) {
            //console.error(error);
        });     
    }

    var loadDoc = function(doc){
        //console.log("Loading Doc : " + doc["name"]);
        //console.dir(doc)
        $("#doc_name").val(doc["name"]);
        $("#doc_name").attr("data-doc-id",doc["id"]);
        var treeHtml = tree_template({
                id:doc["id"],
                name:doc["name"]
        });
        var branchBuffer = undefined;
        var cardsHtmlBuffer = "";
        var treeNew = $(treeHtml);
        doc["cards"]
        .map(function(card){
            //console.log("\n---\n")
            if((/undefined/g).test(branchBuffer)){
                //console.log("No branch buffer");
                branchBuffer = card["branchNo"];
            }

            //console.log("Branch : " + card["branchNo"])
            //console.log("Branch Buffer : " + branchBuffer)

            if(branchBuffer !== card["branchNo"]){
                //console.log("Branch buffer doesn't match");
                var branchHtml = branch_template();
                var branchNew = $(branchHtml);                
                $(branchNew).find(".branch_padding").first().after(cardsHtmlBuffer);
                $(treeNew).find(".tree_padding").last().before(branchNew);
                cardsHtmlBuffer = "";
                branchBuffer = card["branchNo"];
            }

            var cardRender = md.render(card["md"]).trim();
            var cardHtml = card_template({
                id:card["id"],
                parent:card["parentId"],
                ancestors:card["ancestors"],
                md:card["md"],
                render:cardRender
            }); 
            cardsHtmlBuffer += cardHtml;
        });

        if(cardsHtmlBuffer){
                var branchHtml = branch_template();
                var branchNew = $(branchHtml);                
                $(branchNew).find(".branch_padding").first().after(cardsHtmlBuffer);
                $(treeNew).find(".tree_padding").last().before(branchNew);
        }
        
        $("#app-body").html("");
        $("#app-body").append(treeNew);
        $("#"+doc["activeCardId"]).addClass("active");
        scrollToActiveCard();
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
        if(!file_template){
            var source   = $("#file_template").html();
            file_template = Handlebars.compile(source);
        }                                                  
        registerHandlers();     
        db.meta.get("activeDocId")
        .then(function (metaActiveDocId) {
            if(!metaActiveDocId){
                loadHelp();     
            }else{                
                db.docs.get(metaActiveDocId["value"])
                .then(function(doc){                    
                    loadDoc(doc)
                })
            }            
        }).catch(function (error) {
            console.error (error.stack || error);
        });        
    }

    $(document).ready(function(){
        boot();
    });
}(window))
