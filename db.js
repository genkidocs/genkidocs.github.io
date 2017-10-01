(function(window){
    var db = new Dexie("genki_database");
    var dbVersion = 1;
    db.version(dbVersion).stores({
        docs: 'id,name,cards,activeCardId,lastModified',
        meta: 'name,value,lastModified'
    });   
    window.db = db;
}(window))