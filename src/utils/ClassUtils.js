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
        value: {} //class -> className
    })

    ClassUtils.registerClass = function (className, klass) {
        if (!ClassUtils.classLookUp[className]) {
            ClassUtils.classLookUp[className] = klass;
        } else {
            if (ClassUtils.classLookUp[className] === klass) {
                throw new Error(className + ' is registered already with ' + ClassUtils.classLookUp[className].constructor.name);
            }
        }

        if (!ClassUtils.classNameLookUp[klass])
            ClassUtils.classNameLookUp[klass] = className;
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

    weavecore.ClassUtils = ClassUtils;
    //WeaveAPI.ClassUtils = new ClassUtils();

}());
