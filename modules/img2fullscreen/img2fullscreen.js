(function(window){

    var setOverlayBgColor = function(){
        var overlay = $("#img2fullscreenOverlay");
        overlay.css({
            "background-color":"#fff",
        })        
    }

    var openOverlay= function(){
        var overlay = $("#img2fullscreenOverlay");
        overlay.css({
            "position":"fixed",
            "height":"110%",
            "width":"100%",
            "z-index":"999",
            "top":"0",
            "left":"0"    
        })
        overlay.removeClass("sys_hide");        
    }

    var closeOverlay= function(){
        var overlay = $("#img2fullscreenOverlay");
        overlay.css({
            "position":"",
            "height":"",
            "width":"",
            "z-index":"",
            "top":"",
            "left":""    
        })
        overlay.addClass("sys_hide");        
    }


    var centerImg = function(_opts){
        var opts = _opts || {};
        var img = opts["img"];
        if(img){
            var windowWidth = $(window).outerWidth();
            var windowHeight = $(window).outerHeight();
            var imgWidth = img.outerWidth();
            var imgHeight = img.outerHeight();
            var left = (windowWidth - imgWidth) * 0.5;
            var top = (windowHeight - imgHeight) * 0.5;            
            img.css({
                    "left":left+"px",
                    "top":top+"px"
                });            
        }
    }

    var openImg = function(_opts){
        var opts = _opts || {};
        var img = opts["img"];        
        if(img){
            openOverlay();
            img.css({
                    "position":"fixed",
                    "height":"100%",
                    "z-index":"1000"
                });     
            centerImg({img:img});                            
            img.attr("data-img2fullscreen-open","true");
        }
    }

    var closeImg = function(_opts){
        var opts = _opts || {};
        var img = opts["img"];
        if(img){
            closeOverlay();
            img.css({
                "position":"",
                "top":"",
                "height":"",
                "left":"",
                "z-index":""
            }); 
            img.attr("data-img2fullscreen-open","false");
        }
    }

    $(document).ready(function(){
        setOverlayBgColor();
        $("body").on("click",".card .view img",function(evt){
            var img = $(this)
            var open = img.attr("data-img2fullscreen-open") || "false";                        
            switch(open){
                case "false":
                    openImg({img:img});
                break;
                case "true":
                    closeImg({img:img});
                break;
            }
        });
    })

}(window))