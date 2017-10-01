(function(window){
console.log("gapi file loaded!")

var memorySizeOf = function(obj) {
    var bytes = 0;

    var sizeOf = function(obj) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
            case 'number':
                bytes += 8;
                break;
            case 'string':
                bytes += obj.length * 2;
                break;
            case 'boolean':
                bytes += 4;
                break;
            case 'object':
                var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                if(objClass === 'Object' || objClass === 'Array') {
                    for(var key in obj) {
                        if(!obj.hasOwnProperty(key)) continue;
                        sizeOf(obj[key]);
                    }
                } else bytes += obj.toString().length * 2;
                break;
            }
        }
        return bytes;
    };

    var formatByteSize = function(bytes) {
        if(bytes < 1024) return bytes + " bytes";
        else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
        else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
        else return(bytes / 1073741824).toFixed(3) + " GiB";
    };

    return formatByteSize(sizeOf(obj));
};

var CLIENT_ID = '697478862021-lo4tqucl31ti9rvudg7n3pgss93b237i.apps.googleusercontent.com';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
var SCOPES = 'https://www.googleapis.com/auth/drive';
var SYNC_FOLDER_NAME = "GenkiDocsSyncData";

var syncMeta = function(_folder){
    return new Promise(function(resolve, reject){
        var folder = _folder || {};
        db.meta.toArray().then(function(meta){
            console.log("syncMeta called");
            var email = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
            console.log("fetching genki meta");
            var q = "'"+folder["id"]+"' in parents and name contains '"+email+"_meta.json'";
            gapi.client.drive.files.list({
                q:q
            }).then(function(response){
                    var files = response.result.files;
                    var no = files.length;
                    if (files && no > 0) {
                        console.log("["+no+"] Genki meta found");
                        resolve(folder);
                    }else{
                        console.log("No Genki meta found");
                        console.log("Syncing meta")
                        var name = email+"_meta.json";
                        upload({
                            update:"false",
                            data:meta,
                            folder:folder,
                            name:name,
                            genki_type:"meta"
                        });
                        resolve(folder);                        
                    }                 
            });
        });

        
    })
}

var upload = function(_opts){
    return new Promise(function(resolve, reject){
        var opts = _opts || {};
        var update = opts["update"] || "false";
        var data = opts["data"];
        var folder = opts["folder"];
        var name = opts["name"];
        var genki_type = opts["genki_type"];
        var method = "PATCH";
        switch(update){
            case "true":
                method = "PATCH";
            break;
            case "false":
                method = "POST";
            break;            
        }
        var boundary = "___"+uuid()+"___";
        var delim = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";
        var newline = "\r\n\r\n";
        console.log("Boundary : " + boundary);        
        var body =      delim
                        +  "Content-Type: application/json; charset=UTF-8"
                        +  newline
                        +  JSON.stringify({name:name,properties:{"createdBy":"GenkiDocs","genki_type":genki_type},parents:[folder["id"]],mimeType:'application/json'})
                        +  delim
                        +  "Content-Type: application/json; charset=UTF-8"
                        +  newline
                        +  JSON.stringify(data)
                        +  close_delim   
                        ;

        var bodyLength = memorySizeOf(body);  
        console.log("Body Length : " + bodyLength);                               
        var req = gapi.client.request({
            path:"/upload/drive/v3/files",
            method:method,
            params:{
                uploadType:"multipart"
            },
            headers:{
                'Content-Type':"multipart/related; boundary='"+boundary+"'",
                'Content-Length':bodyLength
            },
            body:body
        })
        console.log("Executing request for doc : " + data["id"]);
        req.execute(function(jsonResp,rawResp){
            console.log("Request finished executing request for : " + data["id"]);
            console.dir(rawResp);
            resolve(opts)
        });
    })
}


var uploadDoc = function(_opts){
    return new Promise(function(resolve, reject){
        var opts = _opts || {};
        var update = opts["update"] || "false";
        var doc = opts["doc"];
        var folder = opts["folder"];
        var method = "PATCH";
        switch(update){
            case "true":
                method = "PATCH";
            break;
            case "true":
                method = "POST";
            break;            
        }
        var boundary = "___"+uuid()+"___";
        var delim = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";
        var newline = "\r\n\r\n";
        console.log("Boundary : " + boundary);        
        var body =      delim
                        +  "Content-Type: application/json; charset=UTF-8"
                        +  newline
                        +  JSON.stringify({name:email+"_doc_"+doc["id"],parents:[folder["id"]],mimeType:'application/json'})
                        +  delim
                        +  "Content-Type: application/json; charset=UTF-8"
                        +  newline
                        +  JSON.stringify(doc)
                        +  close_delim   
                        ;

        var bodyLength = memorySizeOf(body);  
        console.log("Body Length : " + bodyLength);                               
        var req = gapi.client.request({
            path:"/upload/drive/v3/files",
            method:method,
            params:{
                uploadType:"multipart"
            },
            headers:{
                'Content-Type':"multipart/related; boundary='"+boundary+"'",
                'Content-Length':bodyLength
            },
            body:body
        })
        console.log("Executing request for doc : " + doc["id"]);
        req.execute(function(jsonResp,rawResp){
            console.log("Request finished executing request for : " + doc["id"]);
            console.dir(rawResp);
            resolve(opts)
        });
    })
}

var syncDocs = function(_folder){
    return new Promise(function(resolve, reject){
        var folder = _folder || {};
        db.docs.toArray().then(function(_docs){
            var offline_docs = _docs;
            var email = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();        
            console.log("syncDocs called"); 
            console.log("fetching genki docs");
            var q = "'"+folder["id"]+"' in parents and properties has {key='genki_type' and value='doc'}";   
            gapi.client.drive.files.list({
                q:q
            }).then(function(response) {          
                var files = response.result.files;
                var no = files.length;
                if (files && no > 0) {
                    console.log("["+no+"] Genki docs found");
                    resolve(folder);
                } else {
                    console.log("No Genki docs found");
                    console.log("Syncing all Docs")
                    offline_docs.map(function(doc){
                        var name = email+"_doc_"+doc["id"]+".json";
                        upload({
                            update:"false",
                            data:doc,
                            folder:folder,
                            name:name,
                            genki_type:"doc"
                        });
                    })
                    resolve(folder);
                }
            }); 
        });


  
    });
};

var syncDataFolder = function(_opts){
    return new Promise(function(resolve, reject){
        var opts = _opts || {};
            console.log("syncDataFolder called");
            console.log("checking for "+SYNC_FOLDER_NAME+" folder");
            var q = " mimeType contains 'application/vnd.google-apps.folder' and name = '"+SYNC_FOLDER_NAME+"' ";
            gapi.client.drive.files.list({
                q:q
            }).then(function(response) {          
                var files = response.result.files;
                if (files && files.length > 0) {
                    console.log(SYNC_FOLDER_NAME+" folder found");
                    console.dir(files);
                    var folder = {
                        id:files[0]["id"]
                    }
                    resolve(folder);
                } else {
                    console.log("No "+SYNC_FOLDER_NAME+" folder found");
                    console.log("creating "+SYNC_FOLDER_NAME+" folder");
                    var fileMetadata = {
                        'name' : SYNC_FOLDER_NAME,
                        'mimeType' : 'application/vnd.google-apps.folder'
                    };            
                    gapi.client.drive.files.create({
                        resource: fileMetadata,
                        fields: 'id'
                    }).execute(function(resp, raw_resp) {
                        console.log(SYNC_FOLDER_NAME+' created : ', resp.id);
                        var folder = {
                            id:resp["id"]
                        }
                        resolve(folder);
                    });            
                }
            });         
    })
}

var syncDb = function(){
    console.log("syncDb called");
    syncDataFolder()
    .then(syncDocs)
    .then(syncMeta);
}

var syncWithGDrive = function(){
    var sys_state = localStorage.getItem("sys_state");  
    console.log("gDrive sync : " + sys_state)                   
    switch(sys_state){
        case "view":
            console.log("Running sync routines");
            var isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get() 
            if(isSignedIn){
                console.log("User is signed in");
                syncDb();
            }else{
                console.log("User isn't signed in");
                gapi.auth2.getAuthInstance().signIn();
                gapi.auth2.getAuthInstance().isSignedIn.listen(function(signedIn){
                    if(signedIn){
                        console.log("User signed in");
                        syncDb();
                    }else{
                        console.log("User did not sign in");
                    }
                });
            }                        
        return false;
    } 
}

var initClient = function(){
    console.log("gapi initClient called!")
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        console.log("Registering gDrive sync shortcut");
        Mousetrap.bindGlobal(['alt+g'], function(e) {   
           syncWithGDrive();
        });  
    });    
}

var handleGapiClientLoad = function(){
    console.log("gapi client loaded!")
    gapi.load('client:auth2', initClient);    
}

window.handleGapiClientLoad = handleGapiClientLoad;
}(window))