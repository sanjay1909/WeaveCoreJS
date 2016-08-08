

import ClassRegistryImpl from "./core/ClassRegistryImpl"
import ISessionManager from "./api/core/ISessionManager"
import IScheduler from "./api/core/IScheduler"
import IProgressIndicator from "./api/core/IProgressIndicator"

export default class WeaveAPI
{
	constructor()
	{
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
WeaveAPI.prototype.CLASS_INFO = { names: [{ name: 'WeaveAPI', qName: 'WeaveAPI'}] };


WeaveAPI.debugAsyncStack = false;
WeaveAPI.debugLocale = false;

WeaveAPI.TASK_PRIORITY_IMMEDIATE = 0;
WeaveAPI.TASK_PRIORITY_HIGH = 1;
WeaveAPI.TASK_PRIORITY_NORMAL = 2;
WeaveAPI.TASK_PRIORITY_LOW = 3;

WeaveAPI._classRegistry = null;

Object.defineProperties(WeaveAPI, {
	ClassRegistry: {
		get: function() {
			if (!WeaveAPI._classRegistry)
				WeaveAPI._classRegistry = new ClassRegistryImpl();
			return WeaveAPI._classRegistry;
		}
	},
	SessionManager: {
		get: function() {
			return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(ISessionManager) || WeaveAPI._classRegistry.getSingletonInstance(ISessionManager);
		}
	},
	Scheduler: {
		get: function() {
			return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(IScheduler) || WeaveAPI._classRegistry.getSingletonInstance(IScheduler);
		}
	},
	ProgressIndicator: {
		get: function() {
			return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(IProgressIndicator) || WeaveAPI._classRegistry.getSingletonInstance(IProgressIndicator);
		}
	}
});

/*,
,

 AttributeColumnCache: {
 get: function() {
 return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(weavejs.api.data.IAttributeColumnCache) || WeaveAPI._classRegistry.getSingletonInstance(weavejs.api.data.IAttributeColumnCache);
 }
 },

 StatisticsCache: {
 get: function() {
 return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(weavejs.api.data.IStatisticsCache) || WeaveAPI._classRegistry.getSingletonInstance(weavejs.api.data.IStatisticsCache);
 }
 },

 QKeyManager: {
 get: function() {
 return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(weavejs.api.data.IQualifiedKeyManager) || WeaveAPI._classRegistry.getSingletonInstance(weavejs.api.data.IQualifiedKeyManager);
 }
 },

 CSVParser: {
 get: function() {
 return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(weavejs.api.data.ICSVParser) || WeaveAPI._classRegistry.getSingletonInstance(weavejs.api.data.ICSVParser);
 }
 },

 URLRequestUtils: {
 get: function() {
 return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(weavejs.api.net.IURLRequestUtils) || WeaveAPI._classRegistry.getSingletonInstance(weavejs.api.net.IURLRequestUtils);
 }
 },

 Locale: {
 get: function() {
 return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(weavejs.api.core.ILocale) || WeaveAPI._classRegistry.getSingletonInstance(weavejs.api.core.ILocale);
 }
 },

 EditorManager: {
 get: function() {
 return (WeaveAPI._classRegistry || WeaveAPI.ClassRegistry).map_interface_singletonInstance.get(weavejs.api.ui.IEditorManager) || WeaveAPI._classRegistry.getSingletonInstance(weavejs.api.ui.IEditorManager);
 }
 }*/





