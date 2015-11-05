/**
 * @sanjaykrishna
 * @shwetapurushe
 */
(function(){
    angular.module('sliderDemoApp', ['ui.slider']);

    angular.module('sliderDemoApp').controller('sliderDemoCtrl', demoController);

    demoController.$inject = ['$scope', '$log', '$timeout'];
    function demoController ($scope, $log, $timeout){
        var dC = this;
        var test = {};
        dC.handleSliderValueChange = handleSliderValueChange;
        dC.updateSessionNavigator = updateSessionNavigator;
        dC.updateSliderValues = updateSliderValues;
        dC.TestItem = TestItem;
        dC.createNewSession = createNewSession;

        test.grandParent = WeaveAPI.globalHashMap.requestObject("grandParent", weavecore.LinkableHashMap, false);
        test.grandParent.addImmediateCallback(WeaveAPI.globalHashMap, function () {
            console.log("Grandparent callback", test.grandParent)
        });
        //test.parent1 = test.grandParent.requestObject("parent1", weavecore.LinkableHashMap, false);
        //test.parent2 = test.grandParent.requestObject("parent2", weavecore.LinkableHashMap, false);

        dC.labeledslider = {
            'options': {
                start: function (event, ui) {
                    $log.info('Event: Slider start');
                },
                stop: function (event, ui) {
                    $log.info('Event: Slider stop');
                    dC.handleSliderValueChange(ui);
                }
            }
        }

        dC.log = new weavecore.SessionStateLog(WeaveAPI.globalHashMap);
        dC.testVar = dC.createNewSession("testNum") // this will cause issue as in session new object is created, tthe reference is changed
        // $scope.testVar.value = 0;

        dC.log.clearHistory();

        var cc = WeaveAPI.SessionManager.getCallbackCollection(dC.log);
        cc.addGroupedCallback({}, dC.updateSliderValues, true);

        dC.increment = function(){
            dC.testVar.value++;
        }
        dC.decrement = function(){
            dC.testVar.value--;
        }
        function createNewSession(name) {
            var oo = test.grandParent.requestObject(name, weavecore.LinkableNumber, false);
            oo.value = 0;

            return oo;
        }

        function handleSliderValueChange(ui) {
            var delta = ui.value - dC.log.undoHistory.length;
            if (delta < 0)
                dC.log.undo(-delta);
            else
                dC.log.redo(delta);

            $scope.$apply();
        }

        function updateSliderValues() {
            dC.sliderPosition = dC.log._undoHistory.length;
            // since this function is called programatically in next frame in next frame ,
            // and not called by UI event , we need to manually trigger digest cycle.
            console.log('UpdateSliderValues called')
            $scope.$apply();
        }

        function updateSessionNavigator() {

            var tr = WeaveAPI.SessionManager.getSessionStateTree(WeaveAPI.globalHashMap, 'weave');
            console.log(tr);
            var newTr = {};
            dC.TestItem(tr, newTr);
            console.log(newTr);
            dC.my_data = [newTr];
            /* $scope.my_data = [{ label: 'hee', children: [{ label: 'inner', children: null }, { label: 'inner 2', children: null }] }]*/
            //$scope.$apply();
        }

        function TestItem(tree, newtree) {
            newtree.label = tree.label;
            if (tree.children && tree.children.constructor === Function) {
                newtree.children = tree.children = tree.children(tree);
            };
            if (tree.children && tree.children.constructor === Array) {
                newtree.children = []
                for (var i = 0; i < tree.children.length; i++) {
                    var newTr = {};
                    TestItem(tree.children[i], newTr);
                    newtree.children[i] = newTr;
                }
            };
        }
    };//end of controller def
})();
