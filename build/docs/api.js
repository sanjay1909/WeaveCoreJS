YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "CallbackCollection",
        "Event",
        "EventDispatcher",
        "Ticker"
    ],
    "modules": [
        "CreateJS"
    ],
    "allModules": [
        {
            "displayName": "CreateJS",
            "name": "CreateJS",
            "description": "A collection of Classes that are shared across all the CreateJS libraries.  The classes are included in the minified\nfiles of each library and are available on the createsjs namespace directly.\n\n<h4>Example</h4>\n\n     myObject.addEventListener(\"change\", createjs.proxy(myMethod, scope));"
        }
    ]
} };
});
