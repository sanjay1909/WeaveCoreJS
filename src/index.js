import 'babel-polyfill';
import { zip } from 'lodash';

import WeaveAPI from './WeaveAPI';
import Weave from './Weave';
import WeaveJS from './WeaveJS';

import CallbackCollection from './core/CallbackCollection';
import LinkableVariable from './core/LinkableVariable';


new WeaveJS().start();

var core = {
	CallbackCollection,
	LinkableVariable
};

export {
	core,
	Weave,
	WeaveAPI
}

window.weavejs = {
	core: core,
	Weave : Weave,
	WeaveAPI: WeaveAPI
};


