/*
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * The Original Code is the Bugzilla Testopia System.
 *
 * The Initial Developer of the Original Code is Greg Hendricks.
 * Portions created by Greg Hendricks are Copyright (C) 2006
 * Novell. All Rights Reserved.
 *
 * Contributor(s): Greg Hendricks <ghendricks@novell.com>
 *                 Ryan Hamilton <rhamilton@novell.com>
 *                 Daniel Parker <dparker1@novell.com>
 */

Testopia.Product.Store = function(class_id, auto){
    Testopia.Product.Store.superclass.constructor.call(this, {
        url: 'tr_quicksearch.cgi',
        root: 'products',
        listeners: { 'exception': Testopia.Util.loadError },
        autoLoad: auto,
        id: 'id',
        baseParams: {
            action: 'getproducts',
            class_id: class_id
        },
        fields: [{
            name: 'id',
            mapping: 'id'
        }, {
            name: 'name',
            mapping: 'name'
        }]
    });
};
Ext.extend(Testopia.Product.Store, Ext.data.JsonStore);

Testopia.Product.VersionStore = function(params, auto){
    params.action = 'getversions';
    Testopia.Product.VersionStore.superclass.constructor.call(this, {
        url: 'tr_quicksearch.cgi',
        root: 'versions',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: params,
        autoLoad: auto,
        id: 'id',
        fields: [{
            name: 'id',
            mapping: 'id'
        }, {
            name: 'name',
            mapping: 'name'
        }]
    });
};
Ext.extend(Testopia.Product.VersionStore, Ext.data.JsonStore);

Testopia.Product.MilestoneStore = function(params, auto){
    params.action = 'getmilestones';
    Testopia.Product.MilestoneStore.superclass.constructor.call(this, {
        url: 'tr_quicksearch.cgi',
        root: 'milestones',
        listeners: { 'exception': Testopia.Util.loadError },
        autoLoad: auto,
        baseParams: params,
        id: 'id',
        fields: [{
            name: 'id',
            mapping: 'id'
        }, {
            name: 'name',
            mapping: 'name'
        }]
    });
};
Ext.extend(Testopia.Product.MilestoneStore, Ext.data.JsonStore);


/*
 * Testopia.Product.Combo
 */
Testopia.Product.Combo = function(cfg){
    Testopia.Product.Combo.superclass.constructor.call(this, {
        id: cfg.id || 'product_combo',
        store: cfg.transform ? false : new Testopia.Product.Store(cfg.params, cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up products...',
        displayField: 'name',
        valueField: 'id',
        typeAhead: true,
        triggerAction: 'all',
        minListWidth: 300,
        forceSelection: true,
        transform: cfg.transform,
        emptyText: 'Please select...'
    });
    Ext.apply(this, cfg);
    this.store.on('load', function(){
        if (cfg.value) {
            this.setValue(cfg.value);
        }
    }, this);
};
Ext.extend(Testopia.Product.Combo, Ext.form.ComboBox);

/*
 * Testopia.Product.VersionCombo
 */
Testopia.Product.VersionCombo = function(cfg){
    Testopia.Product.VersionCombo.superclass.constructor.call(this, {
        id: cfg.id || 'product_version_combo',
        store: cfg.transform ? false : new Testopia.Product.VersionStore(cfg.params, cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up versions...',
        displayField: 'name',
        valueField: 'id',
        typeAhead: true,
        triggerAction: 'all',
        minListWidth: 300,
        forceSelection: true,
        transform: cfg.transform,
        emptyText: 'Please select...'
    });
    Ext.apply(this, cfg);
    this.store.on('load', function(){
        if (cfg.value) {
            this.setValue(cfg.value);
        }
    }, this);
};
Ext.extend(Testopia.Product.VersionCombo, Ext.form.ComboBox);

/*
 * Testopia.Product.MilestoneCombo
 */
Testopia.Product.MilestoneCombo = function(cfg){
    Testopia.Product.MilestoneCombo.superclass.constructor.call(this, {
        id: cfg.id || 'milestone_combo',
        store: cfg.transform ? false : new Testopia.Product.MilestoneStore(cfg.params, cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up milestones...',
        displayField: 'name',
        valueField: 'id',
        typeAhead: true,
        triggerAction: 'all',
        minListWidth: 300,
        forceSelection: true,
        transform: cfg.transform,
        emptyText: 'Please select...'
    });
    Ext.apply(this, cfg);
    this.store.on('load', function(){
        if (cfg.value) {
            this.setValue(cfg.value);
        }
    }, this);
};
Ext.extend(Testopia.Product.MilestoneCombo, Ext.form.ComboBox);
