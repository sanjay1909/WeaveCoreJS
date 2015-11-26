if (typeof window === 'undefined') {
    //this.WeaveAPI = this.WeaveAPI || {};
    this.weavecore = this.weavecore || {};
} else {
    //window.WeaveAPI = window.WeaveAPI || {};
    window.weavecore = window.weavecore || {};
}

(function () {

    function ClassUtils() {

    }

    Object.defineProperty(ClassUtils, 'classLookUp', {
        value: {} //className -> class
    });

    Object.defineProperty(ClassUtils, 'classNameLookUp', {
        value: new Map() //class -> className
    });

    Object.defineProperty(ClassUtils, 'classExtendsMap', {
        value: {}
    })

    Object.defineProperty(ClassUtils, 'classImplementMap', {
        value: {} //[className] [classImplement] = true
    })



    ClassUtils.registerClass = function (className, klass) {
        if (!ClassUtils.classLookUp[className]) {
            ClassUtils.classLookUp[className] = klass;
        } else {
            if (ClassUtils.classLookUp[className] === klass) {
                throw new Error(className + ' is registered already with ' + ClassUtils.classLookUp[className].constructor.name);
            }
        }

        if (!ClassUtils.classNameLookUp.get(klass))
            ClassUtils.classNameLookUp.set(klass, className);
    }



    ClassUtils.registerImplementation = function (className, implementingClassName) {
        if (!ClassUtils.classImplementMap[className]) {
            ClassUtils.classImplementMap[className] = {};
            ClassUtils.classImplementMap[className][implementingClassName] = true;
        } else if (!ClassUtils.classImplementMap[className][implementingClassName]) {
            ClassUtils.classImplementMap[className][implementingClassName] = true;
        }
    }

    ClassUtils.is = function (linkableObject, typeKlasss) {
        if (linkableObject instanceof typeKlasss) { // for class files which aren't manually registered yet
            return true;
        }
        var className = ClassUtils.classNameLookUp.get(linkableObject.constructor);
        if (!className) throw new Errorr('Sessioned Classes can alone use this function.' + typeKlasss.constructor.name + ' is not registered');
        var typeClassName = ClassUtils.classNameLookUp.get(typeKlasss);
        if (!typeClassName) throw new Errorr('Sessioned Classes can alone use this function.' + typeKlasss.constructor.name + ' is not registered');

        if (!ClassUtils.classImplementMap[className]) {
            return false;
        } else if (!ClassUtils.classImplementMap[className][typeClassName]) {
            return false;
        } else {
            return true;
        }
    }

    ClassUtils.getClassDefinition = function (className) {
        if (ClassUtils.classLookUp[className])
            return ClassUtils.classLookUp[className];
        else
            throw new Error(className + ' is not registered with weave yet');
    }

    ClassUtils.hasClassDefinition = function (className) {
        if (ClassUtils.classLookUp[className])
            return true;
        else
            return false;
    }

    ClassUtils.getClassName = function (classDefn) {
        //TO-DO: need to figure out why look up creates the object rather just using as key till then use NS and CLASSNAME
        var className = (classDefn.constructor && classDefn.constructor.NS) ? classDefn.constructor.NS + '.' + classDefn.constructor.CLASS_NAME : ClassUtils.classNameLookUp.get(classDefn);
        return className;

    }

    /**
     * @param classQName A qualified class name of a class in question.
     * @param extendsQName A qualified class name that the class specified by classQName may extend.
     * @return true if clasQName extends extendsQName, or if the two QNames are equal.
     */
    ClassUtils.classExtends = function (classQName, extendsQName) {
        if (classQName === extendsQName)
            return true;


        /* try {
             if (!ClassUtils.cacheClassInfo(classQName))
                 return false;
             return ClassUtils.classExtendsMap[classQName][extendsQName] !== undefined;
         } catch (e) {
             console.log(e.stack);
         }*/
        return ClassUtils.getClassDefinition(classQName).prototype instanceof ClassUtils.getClassDefinition(extendsQName)
    }


    /**
     * This function will populate the  classExtendsMap for the given qualified class name.
     * @param classQName A qualified class name.
     * @return true if the class info has been cached.
     */
    ClassUtils.cacheClassInfo = function (classQName) {
        if (ClassUtils.classExtendsMap[classQName] !== undefined)
            return true; // already cached

        var classDef = ClassUtils.getClassDefinition(classQName);
        if (classDef === null || classDef === undefined)
            return false;


        var eMap = new Object();
        var _extends = classDef.prototype;

        while (_extends) {
            if (ClassUtils.getClassName(_extends))
                eMap[ClassUtils.getClassName(_extends)] = true;
            _extends = _extends.prototype ? _extends.prototype : _extends.__proto__;
        }
        ClassUtils.classExtendsMap[classQName] = eMap;

        return true; // successfully cached
    }

    weavecore.ClassUtils = ClassUtils;
    //WeaveAPI.ClassUtils = new ClassUtils();

}());
