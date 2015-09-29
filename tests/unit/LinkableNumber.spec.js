/**
 * Created by Shweta on 9/25/2015.
 * getting started with Unit tests (TODO get confirmed)
 * @shweta purushe
 */
describe('LinkableNumber', function(){
    var lNumber;
    beforeEach(function(){
        lNumber = new weavecore.LinkableNumber();
        lNumber2 = new weavecore.LinkableNumber(5);}
    );

    it('Should return undefined when a default is not provided', function(){
        expect(lNumber.getSessionState()).toEqual(NaN);
    });

    it('Should return the number value when default is provided', function(){
        expect(lNumber2.value).toEqual(5);
    });
});