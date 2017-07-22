(function(window){
    var sys_state = "view";
    var md = window.markdownit();
    var resizeTextarea = function(e) {
        $(e).css({'height':'auto','overflow-y':'hidden'}).height(e.scrollHeight);
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
    var registerHandlers = function(){

        $('body').on('input','textarea', function () {
            resizeTextarea(this);
        });

        //View | Edit active card
        Mousetrap.bindGlobal(['command+enter', 'ctrl+enter'], function(e) {            
            hideEls([".card.active .edit",".card.active .view"]);
            switch(sys_state){
                case "view":
                    console.log("Switching to edit");
                    showEls([".card.active .edit"]);
                    $(".card.active .edit").focus();
                    sys_state = "edit";
                break;
                case "edit":
                    console.log("Switching to view")
                    var _in = $(".card.active .edit").val();
                    console.log("input : " + _in)
                    var _out = md.render(_in).trim();
                    var html = $(".card.active .view").html().trim();
                    if(_out === html){
                        console.log("html the same");
                    }
                    $(".card.active .view").html(_out);
                    showEls([".card.active .view"]);                    
                    sys_state = "view";
                break;
            }
            return false;
        });
    }
    $(document).ready(function(){
        registerHandlers();
    });
}(window))  

