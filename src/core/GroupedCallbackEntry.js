import CallbackEntry from "./CallbackEntry"
import Weave from "../Weave"
import WeaveAPI from "../WeaveAPI"

import Language from "../util/Language"
import Dictionary2D from "../util/Dictionary2D";

export default class GroupedCallbackEntry extends CallbackEntry
{
	constructor(context, groupedCallback)
	{

		//todo is base requires as we use extends now ?
		super(context, groupedCallback);

		this.targets = [];
		if (!GroupedCallbackEntry._initialized)
		{
			GroupedCallbackEntry._initialized = true;
			WeaveAPI.Scheduler.frameCallbacks.addImmediateCallback(null, GroupedCallbackEntry._handleGroupedCallbacks);
		}

		this.handled = false;
		this.triggered = false;
		this.triggeredAgain = false;
		this.delayWhileBusy = false;

		this.trigger = this.trigger.bind(this);
		this.handleGroupedCallback = this.handleGroupedCallback.bind(this);
		this.dispose = this.dispose.bind(this);
	}

	trigger()
	{
		if (!this.triggered) {
			GroupedCallbackEntry._triggeredEntries.push(this);
			this.triggered = true;
		} else if (this.handled && !this.triggeredAgain) {
			GroupedCallbackEntry._triggeredEntries.push(this);
			this.triggeredAgain = true;
		}
	};


	handleGroupedCallback()
	{
		if (!this.callback)
		{
			Weave.dispose(this);
			return;
		}
		for (var  i = 0; i < this.targets.length; i++) {
			var target = this.targets[i];
			if (WeaveAPI.SessionManager.objectWasDisposed(target))
				this.targets.splice(i--, 1);
			else if (this.delayWhileBusy && WeaveAPI.SessionManager.linkableObjectIsBusy(target))
				return;
		}
		if (this.targets.length == 0) {
			this.dispose();
			GroupedCallbackEntry.d2d_context_callback_entry.remove(this.context, this.callback);
			return;
		}
		if (this.recursionCount == 0) {
			this.recursionCount++;
			this.callback.apply(this.context === GroupedCallbackEntry.CONTEXT_PLACEHOLDER ? this.callback['this'] : this.context);
			this.handled = true;
			this.recursionCount--;
		}
	};


	dispose()
	{
		for (var i in this.targets)
		{
			var target = this.targets[i];

			GroupedCallbackEntry.removeGroupedCallback(target, this.context, this.callback);
		}
		super.dispose();

	};

	REFLECTION_INFO()
	{
		return {
			variables: function () {
				return {
					'handled': { type: 'Boolean'},
					'triggered': { type: 'Boolean'},
					'triggeredAgain': { type: 'Boolean'},
					'delayWhileBusy': { type: 'Boolean'},
					'targets': { type: 'Array'}
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
					'GroupedCallbackEntry': { type: '', declaredBy: 'GroupedCallbackEntry'},
					'trigger': { type: 'void', declaredBy: 'GroupedCallbackEntry'},
					'handleGroupedCallback': { type: 'void', declaredBy: 'GroupedCallbackEntry'},
					'dispose': { type: 'void', declaredBy: 'GroupedCallbackEntry'}
				};
			}
		};
	};

}

GroupedCallbackEntry.prototype.CLASS_INFO = { names: [{ name: 'GroupedCallbackEntry', qName: 'GroupedCallbackEntry'}] };

GroupedCallbackEntry.addGroupedCallback = function(callbackCollection, relevantContext, groupedCallback, triggerCallbackNow, delayWhileBusy)
{
	if (!relevantContext)
		relevantContext = GroupedCallbackEntry.CONTEXT_PLACEHOLDER;

	callbackCollection.removeCallback(relevantContext, groupedCallback);
	var entry = GroupedCallbackEntry.d2d_context_callback_entry.get(relevantContext, groupedCallback);
	if (!entry)
	{
		entry = new GroupedCallbackEntry(relevantContext, groupedCallback);
		GroupedCallbackEntry.d2d_context_callback_entry.set(relevantContext, groupedCallback, entry);
	}
	entry.targets.push(callbackCollection);
	if (delayWhileBusy)
		entry.delayWhileBusy = true;
	callbackCollection.addImmediateCallback(relevantContext, Language.closure(entry.trigger, entry, 'trigger'), triggerCallbackNow);
};


GroupedCallbackEntry.removeGroupedCallback = function(callbackCollection, relevantContext, groupedCallback)
{
	if (!relevantContext)
		relevantContext = GroupedCallbackEntry.CONTEXT_PLACEHOLDER;
	var  entry = GroupedCallbackEntry.d2d_context_callback_entry.get(relevantContext, groupedCallback);
	if (entry)
	{
		callbackCollection.removeCallback(relevantContext, Language.closure(entry.trigger, entry, 'trigger'));
		var index = entry.targets.indexOf(callbackCollection);
		if (index >= 0) {
			entry.targets.splice(index, 1);
			if (entry.targets.length == 0) {
				GroupedCallbackEntry.d2d_context_callback_entry.remove(relevantContext, groupedCallback);
			}
		}
	}
};


GroupedCallbackEntry._handleGroupedCallbacks = function()
{
	var i;
	var entry;
	for (i = 0; i < GroupedCallbackEntry._triggeredEntries.length; i++)
	{
		entry = GroupedCallbackEntry._triggeredEntries[i];
		entry.handleGroupedCallback();
	}
	var entries = GroupedCallbackEntry._triggeredEntries;
	for (var i in entries)
	{
		entry = entries[i];

		entry.handled = entry.triggered = entry.triggeredAgain = false;}

	GroupedCallbackEntry._triggeredEntries.length = 0;
};


GroupedCallbackEntry.CONTEXT_PLACEHOLDER = {};
GroupedCallbackEntry._initialized = false;
GroupedCallbackEntry.d2d_context_callback_entry = new Dictionary2D(true, true);
GroupedCallbackEntry._triggeredEntries = [];

