import WeaveAPI from "./WeaveAPI";
import SessionManager from "./core/SessionManager";
import Scheduler from "./core/Scheduler";
import ProgressIndicator from "./core/ProgressIndicator";

import ISessionManager from "./api/core/ISessionManager";
import IScheduler from "./api/core/IScheduler";
import IProgressIndicator from "./api/core/IProgressIndicator";

export default class WeaveJS
{
	constructor()
	{
		this.start = this.start.bind(this);
	}

	start()
	{
		WeaveAPI.ClassRegistry['defaultPackages'].push(
			'',
			'weavejs',
			'weavejs.api',
			'weavejs.api.core',
			'weavejs.core',
			'weavejs.path',
			'weavejs.util'
		);

		WeaveAPI.ClassRegistry.registerSingletonImplementation(ISessionManager, SessionManager);
		WeaveAPI.ClassRegistry.registerSingletonImplementation(IScheduler, Scheduler);
		WeaveAPI.ClassRegistry.registerSingletonImplementation(IProgressIndicator, ProgressIndicator);

		//WeaveAPI.ClassRegistry.registerImplementation(ILinkableHashMap, LinkableHashMap);
		//WeaveAPI.ClassRegistry.registerImplementation(ILinkableDynamicObject, LinkableDynamicObject);
	}



	REFLECTION_INFO()
	{
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
				};
			}
		};
	};
}

WeaveJS.prototype.CLASS_INFO = { names: [{ name: 'WeaveJS', qName: 'WeaveJS'}] };

