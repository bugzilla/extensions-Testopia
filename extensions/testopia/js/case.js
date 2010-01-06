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
 *                 M-A Parent<maparent@miranda.com>
 */

Testopia.TestCase.Store = function(params, auto){
    Testopia.TestCase.Store.superclass.constructor.call(this, {
        url: 'tr_list_cases.cgi',
        baseParams: params,
        listeners: { 'exception': Testopia.Util.loadError },
        totalProperty: 'totalResultsAvailable',
        root: 'Result',
        autoLoad: auto,
        id: 'case_id',
        fields: [{
            name: "case_id",
            mapping: "case_id"
        }, {
            name: "plan_id",
            mapping: "plan_id"
        }, {
            name: "alias",
            mapping: "alias"
        }, {
            name: "case_summary",
            mapping: "summary"
        }, {
            name: "author",
            mapping: "author_name"
        }, {
            name: "tester",
            mapping: "default_tester"
        }, {
            name: "creation_date",
            mapping: "creation_date"
        }, {
            name: "category",
            mapping: "category_name"
        }, {
            name: "priority",
            mapping: "priority"
        }, {
            name: "status",
            mapping: "status"
        }, {
            name: "run_count",
            mapping: "run_count"
        }, {
            name: "requirement",
            mapping: "requirement"
        }, {
            name: "isautomated",
            mapping: "isautomated"
        }],
        remoteSort: true
    });
    
};
Ext.extend(Testopia.TestCase.Store, Ext.data.JsonStore);

Testopia.TestCase.StatusListStore = function(auto){
    Testopia.TestCase.StatusListStore.superclass.constructor.call(this, {
        url: 'tr_quicksearch.cgi',
        root: 'statuses',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getcasestatus'
        },
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
Ext.extend(Testopia.TestCase.StatusListStore, Ext.data.JsonStore);

Testopia.TestCase.ComponentStore = function(params, auto){
    params.action = 'getcomponents';
    Testopia.TestCase.ComponentStore.superclass.constructor.call(this, {
        url: 'tr_quicksearch.cgi',
        root: 'components',
        baseParams: params,
        listeners: { 'exception': Testopia.Util.loadError },
        autoLoad: auto,
        id: 'id',
        fields: [{
            name: 'id',
            mapping: 'id'
        }, {
            name: 'name',
            mapping: 'name'
        }, {
            name: 'qa',
            mapping: 'qa_contact'
        }, {
            name: 'product',
            mapping: 'product'
        }]
    });
};
Ext.extend(Testopia.TestCase.ComponentStore, Ext.data.JsonStore);

Testopia.TestCase.PriorityStore = function(auto){
    Testopia.TestCase.PriorityStore.superclass.constructor.call(this, {
        url: 'tr_quicksearch.cgi',
        root: 'priorities',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getpriorities'
        },
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
Ext.extend(Testopia.TestCase.PriorityStore, Ext.data.JsonStore);

/*
 * Testopia.TestCase.StatusListCombo
 */
Testopia.TestCase.StatusListCombo = function(cfg){
    Testopia.TestCase.StatusListCombo.superclass.constructor.call(this, {
        id: cfg.id || 'case_status_combo',
        store: cfg.transform ? false : new Testopia.TestCase.StatusListStore(cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up statuses...',
        displayField: 'name',
        valueField: 'id',
        typeAhead: true,
        triggerAction: 'all',
        minListWidth: 100,
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
Ext.extend(Testopia.TestCase.StatusListCombo, Ext.form.ComboBox);

/*
 * Testopia.TestCase.ComponentCombo
 */
Testopia.TestCase.ComponentCombo = function(cfg){
    Testopia.TestCase.ComponentCombo.superclass.constructor.call(this, {
        id: cfg.id || 'component_combo',
        store: cfg.transform ? false : new Testopia.TestCase.ComponentStore(cfg.params, cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up Components...',
        displayField: 'name',
        valueField: 'id',
        editable: true,
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
Ext.extend(Testopia.TestCase.ComponentCombo, Ext.form.ComboBox);

/*
 * Testopia.TestCase.PriorityCombo
 */
Testopia.TestCase.PriorityCombo = function(cfg){
    Testopia.TestCase.PriorityCombo.superclass.constructor.call(this, {
        id: cfg.id || 'priority_combo',
        store: cfg.transform ? false : new Testopia.TestCase.PriorityStore(cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up priorities...',
        displayField: 'name',
        valueField: 'id',
        typeAhead: true,
        triggerAction: 'all',
        minListWidth: 100,
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
Ext.extend(Testopia.TestCase.PriorityCombo, Ext.form.ComboBox);

Testopia.TestCase.Panel = function(params, cfg){
    var cgrid = new Testopia.TestCase.Grid(params, cfg);
    var filter = new Testopia.TestCase.Filter();
    this.cgrid = cgrid;
    this.store = cgrid.store;
    this.params = params;
    
    Testopia.TestCase.Panel.superclass.constructor.call(this, {
        title: 'Test Cases',
        layout: 'border',
        id: 'case-panel',
        items: [filter, cgrid]
    });
    
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.TestCase.Panel, Ext.Panel, {
    onActivate: function(event){
        if (!this.store.getCount()) {
            this.store.load({
                params: this.params
            });
        }
    }
});

Testopia.TestCase.Filter = function(){
    this.form = new Ext.form.BasicForm('testopia_helper_frm', {});
    Testopia.TestCase.Filter.superclass.constructor.call(this, {
        title: 'Search for Test Cases',
        region: 'north',
        layout: 'fit',
        frame: true,
        collapsible: true,
        height: 120,
        items: [{
            buttons: [{
                text: 'Search',
                handler: function(){
                    Ext.getCmp('case_search').getForm().submit();
                }
            }]
        }]
    });
};
Ext.extend(Testopia.TestCase.Filter, Ext.Panel);

Testopia.TestCase.Grid = function(params, cfg){
    params.limit = Ext.state.Manager.get('TESTOPIA_DEFAULT_PAGE_SIZE', 25);
    params.current_tab = 'case';
    this.params = params;
    var categoryCombo = new Testopia.Category.Combo({
        id: 'case_grid_cateogy_chooser',
        hiddenName: 'category',
        mode: 'remote',
        params: {
            product_id: params.product_id
        },
        listeners: {
            'startedit': function(){
                var pid = Ext.getCmp(cfg.id || 'case_grid').getSelectionModel().getSelected().get('product_id');
                if (categoryCombo.store.baseParams.product_id != pid) {
                    categoryCombo.store.baseParams.product_id = pid;
                    categoryCombo.store.load();
                }
            }
        }

    });
    
    this.store = new Ext.data.GroupingStore({
        url: 'tr_list_cases.cgi',
        baseParams: params,
        reader: new Ext.data.JsonReader({
            totalProperty: 'totalResultsAvailable',
            root: 'Result',
            id: 'case_id',
            fields: [{
                name: "case_id",
                mapping: "case_id"
            }, {
                name: "sortkey",
                mapping: "sortkey"
            }, {
                name: "plan_id",
                mapping: "plan_id"
            }, {
                name: "alias",
                mapping: "alias"
            }, {
                name: "summary",
                mapping: "summary"
            }, {
                name: "author",
                mapping: "author_name"
            }, {
                name: "tester",
                mapping: "default_tester"
            }, {
                name: "creation_date",
                mapping: "creation_date"
            }, {
                name: "category",
                mapping: "category_name"
            }, {
                name: "priority",
                mapping: "priority"
            }, {
                name: "status",
                mapping: "status"
            }, {
                name: "run_count",
                mapping: "run_count"
            }, {
                name: "requirement",
                mapping: "requirement"
            }, {
                name: "product_id",
                mapping: "product_id"
            }, {
                name: "component",
                mapping: "component"
            }, {
                name: "modified",
                mapping: "modified"
            }, {
                name: "isautomated",
                mapping: "isautomated"
            }, {
                name: "plan_name",
                mapping: "plan_name"
            }, {
                name: "average_time",
                mapping: "average_time"
            }, {
                name: "estimated_time",
                mapping: "estimated_time"
            }]
        }),
        listeners: { 'exception': Testopia.Util.loadError },
        remoteSort: true,
        sortInfo: {
            field: 'case_id',
            direction: "ASC"
        },
        groupField: params.plan_id ? '' : 'plan_id'
    });
    var ds = this.store;
    ds.paramNames.sort = "order";
    ds.on('beforeload', function(store, o){
        store.baseParams.ctype = 'json';
    });
    
    this.columns = [{
        header: "ID",
        width: 50,
        dataIndex: 'case_id',
        sortable: true,
        groupRenderer: function(v){
            return v;
        },
        renderer: Testopia.Util.makeLink.createDelegate(this,['case'],true),
        hideable: false
    }, {
        header: "Sort Key",
        width: 50,
        sortable: true,
        dataIndex: 'sortkey',
        editor: {
            xtype: 'numberfield',
            allowBlank: true,
            allowDecimals: false,
            allowNegative: false
        },
        id: "sortkey"
    }, {
        header: "Summary",
        width: 220,
        dataIndex: 'summary',
        id: "case_summary",
        sortable: true,
        editor: {
            xtype: 'textfield',
            allowBlank: false
        }
    }, {
        header: "Author",
        width: 150,
        sortable: true,
        dataIndex: 'author',
        hidden: true
    }, {
        header: "Default Tester",
        width: 150,
        sortable: true,
        dataIndex: 'tester',
        editor: new Testopia.User.Lookup({
            hiddenName: 'tester'
        }),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Created",
        width: 110,
        sortable: true,
        dataIndex: 'creation_date',
        hidden: true
    }, {
        header: "Last Modified",
        width: 110,
        sortable: true,
        dataIndex: 'modified',
        hidden: true
    }, {
        header: "Priority",
        width: 100,
        sortable: true,
        dataIndex: 'priority',
        editor: new Testopia.TestCase.PriorityCombo({
            hiddenName: 'priority',
            mode: 'remote'
        }),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Category",
        width: 100,
        sortable: true,
        dataIndex: 'category',
        editor: categoryCombo,
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Component",
        width: 110,
        sortable: true,
        dataIndex: 'component'
    }, {
        header: "Status",
        width: 100,
        sortable: true,
        dataIndex: 'status',
        editor: new Testopia.TestCase.StatusListCombo('status'),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Requirement",
        width: 40,
        sortable: true,
        dataIndex: 'requirement',
        hidden: true,
        editor: {
            xtype: 'textfield',
            name: 'requirement'
        }
    }, {
        header: "Estimated Time",
        width: 60,
        sortable: true,
        dataIndex: 'estimated_time',
        editor: {
            xtype: 'textfield'
        },
        hidden: true
    }, {
        header: "Average Time",
        width: 60,
        sortable: false,
        dataIndex: 'average_time',
        hidden: true
    }, {
        header: "Plan",
        width: 40,
        sortable: true,
        dataIndex: 'plan_id',
        hidden: true,
        renderer: Testopia.Util.makeLink.createDelegate(this,['plan'],true),
        groupRenderer: function(v, u, r){
            return v + ': "' + r.get('plan_name') + '"';
        }
    }, {
        header: "Run Count",
        width: 40,
        sortable: false,
        dataIndex: 'run_count',
        hidden: true
    }];
    this.view = new Ext.grid.GroupingView({
        forceFit: true,
        groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})'
    });
    
    this.form = new Ext.form.BasicForm('testopia_helper_frm', {});
    this.bbar = new Testopia.Util.PagingBar('case', this.store);
    Testopia.TestCase.Grid.superclass.constructor.call(this, {
        title: 'Test Cases',
        id: cfg.id || 'case_grid',
        loadMask: {
            msg: 'Loading Test Cases...'
        },
        layout: 'fit',
        stripeRows: true,
        region: 'center',
        autoExpandColumn: "case_summary",
        autoScroll: true,
        plugins: [new Ext.ux.grid.RowEditor({
            id:'case_row_editor',
            saveText: 'Update'
        })],
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false,
            listeners: {
                'rowselect': function(sm, i, r){
                    if (Ext.getCmp('delete_case_list_btn')) {
                        Ext.getCmp('delete_case_list_btn').enable();
                        Ext.getCmp('edit_case_list_btn').enable();
                    }
                },
                'rowdeselect': function(sm, i, r){
                    if (sm.getCount() < 1) {
                        if (Ext.getCmp('delete_case_list_btn')) {
                            Ext.getCmp('delete_case_list_btn').disable();
                            Ext.getCmp('edit_case_list_btn').disable();
                        }
                    }
                }
            }
        }),
        viewConfig: {
            forceFit: true
        },
        tbar: [new Ext.Toolbar.Fill(), 
        {
            xtype: 'button',
            id: 'case_grid_tocsv',
            icon: 'extensions/testopia/img/csv.png',
            iconCls: 'img_button_16x',
            tooltip: 'Export Test Cases to CSV',
            handler: function(){
                window.location = 'tr_list_cases.cgi?ctype=csv&viewall=1&' + Testopia.Util.JSONToURLQuery(Ext.getCmp(cfg.id || 'case_grid').store.baseParams, '', ['viewall', 'ctype']);
            }
        },{
            xtype: 'button',
            id: 'case_grid_toxml',
            icon: 'extensions/testopia/img/xml.png',
            iconCls: 'img_button_16x',
            tooltip: 'Export Test Cases to XML',
            handler: function(){
                window.location = 'tr_list_cases.cgi?ctype=xml&viewall=1&' + Testopia.Util.JSONToURLQuery(Ext.getCmp(cfg.id || 'case_grid').store.baseParams, '', ['viewall', 'ctype']);
            }
        },{
            xtype: 'button',
            id: 'save_case_list_btn',
            icon: 'extensions/testopia/img/save.png',
            iconCls: 'img_button_16x',
            tooltip: 'Save this search',
            handler: function(b, e){
                Testopia.Search.save('case', Ext.getCmp(cfg.id || 'case_grid').store.baseParams);
            }
        }, {
            xtype: 'button',
            id: 'link_case_list_btn',
            icon: 'extensions/testopia/img/link.png',
            iconCls: 'img_button_16x',
            tooltip: 'Create a link to this list',
            handler: function(b, e){
                Testopia.Search.LinkPopup(Ext.getCmp(cfg.id || 'case_grid').store.baseParams);
            }
        }, {
            xtype: 'button',
            id: 'edit_case_list_btn',
            icon: 'extensions/testopia/img/edit.png',
            disabled: true,
            iconCls: 'img_button_16x',
            tooltip: 'Edit Selected Test Case',
            handler: function(){
                Testopia.Util.editFirstSelection(Ext.getCmp(cfg.id || 'case_grid'));
            }
        }, {
            xtype: 'button',
            id: 'add_case_list_btn',
            icon: 'extensions/testopia/img/new.png',
            iconCls: 'img_button_16x',
            tooltip: 'Create a New Test Case',
            handler: function(){
                try {
                    if (plan) {
                        Testopia.TestCase.NewCasePopup(plan.plan_id, plan.product_id);
                    }
                } 
                catch (err) {
                    window.location = 'tr_new_case.cgi';
                }
            }
        }, {
            xtype: 'button',
            id: 'delete_case_list_btn',
            disabled: true,
            icon: 'extensions/testopia/img/delete.png',
            iconCls: 'img_button_16x',
            tooltip: 'Delete Selected Test Cases',
            handler: this.deleteList.createDelegate(this)
        }]
    });
    Ext.apply(this, cfg);
    
    this.on('activate', this.onActivate, this);
    this.on('rowcontextmenu', this.onContextClick, this);
    Ext.getCmp('case_row_editor').on('afteredit', this.onGridEdit, this);
};

Ext.extend(Testopia.TestCase.Grid, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        grid.selindex = index;
        if (!this.menu) { // create context menu on first right click
            var hasplan;
            try {
                hasplan = plan ? false : true;
            } 
            catch (err) {
                hasplan = true;
            }
            
            this.menu = new Ext.menu.Menu({
                id: 'case_list_ctx_menu',
                enableScrolling: false,
                items: [{
                    text: 'Modify Selected Test Cases',
                    icon: 'extensions/testopia/img/edit.png',
                    iconCls: 'img_button_16x',
                    menu: {
                        enableScrolling: false,
                        items: [{
                            text: 'Requirements',
                            handler: function(){
                                Ext.Msg.prompt('Edit Requirements', '', function(btn, text){
                                    if (btn == 'ok') {
                                        Testopia.Util.updateFromList('case', {
                                            requirement: text,
                                            ids: Testopia.Util.getSelectedObjects(grid, 'case_id')
                                        }, grid);
                                    }
                                });
                            }
                        }, {
                            text: 'Category',
                            disabled: hasplan,
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Edit Category',
                                    id: 'status-win',
                                    plain: true,
                                    shadow: false,
                                    width: 300,
                                    height: 150,
                                    items: [new Testopia.Category.Combo({
                                        fieldLabel: 'Category',
                                        params: {
                                            product_id: plan.product_id
                                        }
                                    })],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            Testopia.Util.updateFromList('case', {
                                                category: Ext.getCmp('case_category_combo').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'case_id')
                                            }, grid);
                                            win.close();
                                        }
                                    }, {
                                        text: 'Close',
                                        handler: function(){
                                            win.close();
                                        }
                                    }]
                                });
                                win.show(this);
                            }
                        }, {
                            text: 'Status',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Edit Status',
                                    id: 'status-win',
                                    plain: true,
                                    shadow: false,
                                    listeners: {'afterlayout':function(){Ext.getCmp('case_status_update').focus('',10)}},
                                    width: 300,
                                    height: 150,
                                    items: [new Testopia.TestCase.StatusListCombo({
                                        id:'case_status_update',
                                        fieldLabel: 'Status'
                                    })],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            Testopia.Util.updateFromList('case', {
                                                status: Ext.getCmp('case_status_update').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'case_id')
                                            }, grid);
                                            win.close();
                                        }
                                    }, {
                                        text: 'Close',
                                        handler: function(){
                                            win.close();
                                        }
                                    }]
                                });
                                win.show(this);
                            }
                        }, {
                            text: 'Priority',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Edit Priority',
                                    id: 'priority-win',
                                    layout: 'form',
                                    plain: true,
                                    shadow: false,
                                    listeners: {'afterlayout':function(){Ext.getCmp('case_priority_update').focus('',10)}},
                                    width: 300,
                                    height: 150,
                                    labelWidth: 30,
                                    items: [new Testopia.TestCase.PriorityCombo({
                                        id: 'case_priority_update',
                                        fieldLabel: 'Priority'
                                    })],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            Testopia.Util.updateFromList('case', {
                                                priority: Ext.getCmp('case_priority_update').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'case_id')
                                            }, grid);
                                            win.close();
                                        }
                                    }, {
                                        text: 'Close',
                                        handler: function(){
                                            win.close();
                                        }
                                    }]
                                });
                                win.show(this);
                            }
                        }, {
                            text: 'Tester',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Change Default Tester',
                                    id: 'def_tester_win',
                                    layout: 'fit',
                                    plain: true,
                                    shadow: false,
                                    split: true,
                                    listeners: {'afterlayout':function(){Ext.getCmp('tester_update').focus('',10)}},
                                    width: 350,
                                    height: 150,
                                    items: [new Ext.FormPanel({
                                        labelWidth: '40',
                                        bodyStyle: 'padding: 5px',
                                        items: [new Testopia.User.Lookup({
                                            id: 'tester_update',
                                            fieldLabel: 'Default Tester'
                                        })]
                                    })],
                                    buttons: [{
                                        text: 'Update Tester',
                                        handler: function(){
                                            Testopia.Util.updateFromList('case', {
                                                tester: Ext.getCmp('tester_update').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'case_id')
                                            }, grid);
                                            win.close();
                                        }
                                    }, {
                                        text: 'Cancel',
                                        handler: function(){
                                            win.close();
                                        }
                                    }]
                                });
                                win.show();
                            }
                        }, {
                            text: 'Automation',
                            handler: function(){
                            
                                var chbx = new Ext.form.Checkbox({
                                    checked: false,
                                    name: 'isautomated',
                                    id: 'isautomated_update',
                                    fieldLabel: 'Enable Automation'
                                });
                                
                                var scripttext = new Ext.form.TextField({
                                    xtype: 'textfield',
                                    disabled: true,
                                    name: 'script',
                                    fieldLabel: 'Script '
                                });
                                
                                var argumenttext = new Ext.form.TextField({
                                    xtype: 'textfield',
                                    name: 'arguments',
                                    disabled: true,
                                    fieldLabel: 'Arguments '
                                });
                                
                                chbx.on('check', function(){
                                    if (scripttext.disabled) {
                                        scripttext.enable();
                                        argumenttext.enable();
                                    }
                                    else {
                                        scripttext.disable();
                                        argumenttext.disable();
                                    }
                                }, chbx);
                                
                                var win = new Ext.Window({
                                    title: 'Edit Automation Settings',
                                    id: 'auto-win',
                                    layout: 'form',
                                    plain: true,
                                    shadow: false,
                                    listeners: {'afterlayout':function(){Ext.getCmp('isautomated_update').focus('',10)}},
                                    width: 350,
                                    height: 250,
                                    items: [{
                                        id: 'automation_form',
                                        bodyStyle: 'padding: 5px',
                                        xtype: 'form',
                                        items: [chbx, argumenttext, scripttext]
                                    }],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            params = Ext.getCmp('automation_form').getForm().getValues();
                                            params.ids = Testopia.Util.getSelectedObjects(grid, 'case_id');
                                            Testopia.Util.updateFromList('case', params, grid);
                                            win.close();
                                        }
                                    }, {
                                        text: 'Close',
                                        handler: function(){
                                            win.close();
                                        }
                                    }]
                                });
                                win.show(this);
                            }
                        }]
                    }
                }, {
                    text: 'Delete Selected Test Cases',
                    icon: 'extensions/testopia/img/delete.png',
                    iconCls: 'img_button_16x',
                    handler: this.deleteList.createDelegate(this)
                
                }, {
                    text: 'Add Selected Test Cases to Run... ',
                    handler: function(){
                        Ext.Msg.prompt('Add to runs', '', function(btn, text){
                            if (btn == 'ok') {
                                Testopia.Util.updateFromList('case', {
                                    addruns: text,
                                    ids: Testopia.Util.getSelectedObjects(grid, 'case_id')
                                }, grid);
                            }
                        });
                    }
                }, {
                    text: 'Copy or Link Selected Test Cases to Plan(s)... ',
                    handler: function(){
                        var r = grid.getSelectionModel().getSelected();
                        Testopia.TestCase.clonePopup(r.get('product_id'), Testopia.Util.getSelectedObjects(grid, 'case_id'));
                    }
                }, {
                    text: 'Unlink from Plan',
                    disabled: hasplan,
                    handler: function(){
                        Ext.Msg.show({
                            title: 'Unlink Selected Test Cases',
                            msg: 'You are about to unlink the selected test cases from this plan. If a test case is not linked to any other plans, it will be deleted. Do you want to continue?',
                            buttons: Ext.Msg.YESNO,
                            icon: Ext.Msg.WARNING,
                            fn: function(btn){
                                if (btn == 'yes') {
                                    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm');
                                    testopia_form.submit({
                                        url: 'tr_list_cases.cgi',
                                        params: {
                                            case_ids: Testopia.Util.getSelectedObjects(grid, 'case_id'),
                                            action: 'unlink',
                                            plan_id: plan.plan_id
                                        },
                                        success: function(data){
                                            Ext.Msg.show({
                                                msg: "Test cases removed",
                                                buttons: Ext.Msg.OK,
                                                icon: Ext.MessageBox.INFO
                                            });
                                            grid.store.reload();
                                        },
                                        failure: function(f, a){
                                            Testopia.Util.error(f, a);
                                            grid.store.reload();
                                        }
                                    });
                                }
                            }
                        })
                    }
                }, {
                    text: 'Add or Remove Tags from Selected Cases...',
                    handler: function(){
                        Testopia.Tags.update('case', grid);
                    }
                }, {
                    text: 'Add or Remove Bugs from Selected Cases...',
                    handler: function(){
                        Testopia.TestCase.Bugs.update(grid);
                    }
                }, {
                    text: 'Add or Remove Components from Selected Cases...',
                    handler: function(){
                        var win = new Ext.Window({
                            title: 'Add or Remove Components',
                            id: 'component_update_win',
                            layout: 'fit',
                            split: true,
                            plain: true,
                            shadow: false,
                            width: 550,
                            height: 85,
                            items: [new Testopia.TestCase.Components(grid)]
                        });
                        win.show();
                    }
                }, {
                    text: 'Refresh List',
                    icon: 'extensions/testopia/img/refresh.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        grid.store.reload();
                    }
                }, {
                    text: 'View Test Case(s) in a New Tab',
                    handler: function(){
                        var case_ids = Testopia.Util.getSelectedObjects(grid, 'case_id').split(',');
                        var i;
                        for (i = 0; i < case_ids.length; i += 1) {
                            window.open('tr_show_case.cgi?case_id=' + case_ids[i]);
                        }
                    }
                }]
            });
        }
        e.stopEvent();
        if (grid.getSelectionModel().getCount() < 1) {
            grid.getSelectionModel().selectRow(index);
        }
        this.menu.showAt(e.getXY());
    },
    onGridEdit: function(e){
        var ds = this.store;
        var myparams = e.record.data;
        myparams.action = 'edit';
        var tester;
        if (!myparams.tester.match('@')){
            tester = myparams.tester;
            delete myparams.tester;
        }
        this.form.submit({
            url: "tr_process_case.cgi",
            params: myparams,
            success: function(f, a){
                if (tester)
                    myparams.tester = tester;
                ds.commitChanges();
            },
            failure: function(f, a){
                Testopia.Util.error(f, a);
                if (tester)
                    myparams.tester = tester;
                ds.rejectChanges();
            }
        });
    },
    deleteList: function(){
        var grid = this;
        Ext.Msg.show({
            title: 'Confirm Delete?',
            msg: CASE_DELETE_WARNING,
            buttons: Ext.Msg.YESNO,
            animEl: 'case-delete-btn',
            icon: Ext.MessageBox.QUESTION,
            fn: function(btn){
                if (btn == 'yes') {
                    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm');
                    testopia_form.submit({
                        url: 'tr_list_cases.cgi',
                        params: {
                            case_ids: Testopia.Util.getSelectedObjects(grid, 'case_id'),
                            action: 'delete'
                        },
                        success: function(data){
                            Ext.Msg.show({
                                msg: "Test cases deleted",
                                buttons: Ext.Msg.OK,
                                icon: Ext.MessageBox.INFO
                            });
                            grid.store.reload();
                        },
                        failure: function(f, a){
                            Testopia.Util.error(f, a);
                            grid.store.reload();
                        }
                    });
                }
            }
        });
    },
    
    onActivate: function(event){
        if (!this.store.getCount()) {
            this.store.load();
        }
    }
});

Testopia.TestCase.NewCaseForm = function(plan_ids, product_id, run_id){
    Testopia.TestCase.NewCaseForm.superclass.constructor.call(this, {
        id: 'newcaseform',
        url: 'tr_new_case.cgi',
        baseParams: {
            action: 'add'
        },
        fileUpload: true,
        labelAlign: 'left',
        frame: true,
        title: 'Create a New Test Case',
        bodyStyle: 'padding:5px 5px 0',
        width: 1050,
        height: 670,
        items: [{
            layout: 'table',
            layoutConfig: {
                columns: 2,
                width: '100%'
            },
            items: [{
                colspan: 2,
                layout: 'form',
                items: [{
                    id: 'ncf-summary',
                    xtype: 'textfield',
                    fieldLabel: '<b>Summary</b>',
                    name: 'summary',
                    allowBlank: false,
                    width: 800
                }, {
                    xtype: 'hidden',
                    name: 'components',
                    id: 'compfield'
                }, {
                    xtype: 'hidden',
                    name: 'plan_id',
                    id: 'planfield',
                    value: plan_ids
                }]
            }, {
                layout: 'form',
                items: [new Testopia.User.Lookup({
                    id: 'default_tester',
                    hiddenName: 'tester',
                    fieldLabel: 'Default Tester'
                }), {
                    xtype: 'textfield',
                    fieldLabel: 'Alias',
                    id: 'case_alias',
                    name: 'alias'
                }, new Testopia.TestCase.PriorityCombo({
                    fieldLabel: '<b>Priority</b>&nbsp;&nbsp;<img src="images/help.png" id="priority_help" style="cursor:pointer" onclick=\'window.open("testing_priorities.html","Priority Definitions","resizable=no, scrollbars=yes, width=550,height=420");\'/>',
                    hiddenName: 'priority',
                    mode: 'local',
                    allowBlank: false
                }), new Testopia.Category.Combo({
                    fieldLabel: '<b>Category</b>',
                    hiddenName: 'category',
                    mode: 'local',
                    allowBlank: false,
                    params: {
                        product_id: product_id
                    }
                }), {
                    xtype: 'textfield',
                    fieldLabel: 'Estimated Time (HH:MM:SS)',
                    id: 'estimated_time',
                    name: 'estimated_time'
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Bugs',
                    id: 'ncf-bugs',
                    name: 'bugs'
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Blocks',
                    id: 'ncf-blocks',
                    name: 'tcblocks'
                }]
            
            }, {
                layout: 'form',
                items: [new Testopia.TestCase.StatusListCombo({
                    fieldLabel: '<b>Status</b>',
                    hiddenName: 'status',
                    mode: 'local',
                    value: DEFAULT_CASE_STATUS,
                    allowBlank: false,
                    id: 'ncf-casestatus'
                }), {
                    xtype: 'textfield',
                    fieldLabel: 'Add Tags',
                    id: 'ncf-addtags',
                    name: 'addtags'
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Requirements',
                    id: 'ncf-reqs',
                    name: 'requirement'
                }, {
                    xtype: 'checkbox',
                    fieldLabel: 'Automated',
                    id: 'ncf-automated',
                    name: 'isautomated',
                    value: '1'
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Scripts',
                    id: 'ncf-scripts',
                    name: 'script'
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Arguments',
                    id: 'ncf-arguments',
                    name: 'arguments'
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Add to Run',
                    id: 'ncf-addtorun',
                    name: 'addruns',
                    value: run_id
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Depends On',
                    id: 'ncf-dependson',
                    name: 'tcdependson'
                }]
            
            }]
        }, {
            xtype: 'tabpanel',
            id: 'ncf_tabs',
            height: 356,
            activeItem: 1,
            items: [{
                layout: 'column',
                title: 'Setup Procedures',
                items: [{
                    columnWidth: 0.5,
                    items: [{
                        title: 'Setup',
                        layout: 'fit',
                        items: [{
                            id: 'ncf-setup_doc',
                            name: 'tcsetup',
                            xtype: 'htmleditor',
                            scrollable: true
                        }]
                    }]
                }, {
                    columnWidth: 0.5,
                    items: [{
                        title: 'Break Down',
                        layout: 'fit',
                        items: [{
                            id: 'ncf-breakdown_doc',
                            name: 'tcbreakdown',
                            xtype: 'htmleditor',
                            scrollable: true
                        }]
                    }]
                }]
            }, {
            
                layout: 'column',
                title: 'Actions',
                items: [{
                    columnWidth: 0.5,
                    items: [{
                        title: 'Action',
                        layout: 'fit',
                        items: [{
                            id: 'ncf-action',
                            name: 'tcaction',
                            xtype: 'htmleditor',
                            scrollable: true,
                            listeners: {
                                'initialize': function(h){
                                    if (!h.getValue()) {
                                        var httpRequest = new Ext.data.Connection();
                                        httpRequest.request({
                                            url: 'tr_quicksearch.cgi',
                                            params: {
                                                action: 'get_action'
                                            },
                                            success: function(d){
                                                h.setValue(d.responseText);
                                            },
                                            failure: Testopia.Util.error
                                        });
                                    }
                                }
                            }
                        }]
                    }]
                }, {
                    columnWidth: 0.5,
                    items: [{
                        title: 'Expected Results',
                        layout: 'fit',
                        items: [{
                            id: 'ncf-effect',
                            name: 'tceffect',
                            xtype: 'htmleditor',
                            scrollable: true,
                            listeners: {
                                'initialize': function(h){
                                    if (!h.getValue()) {
                                        var httpRequest = new Ext.data.Connection();
                                        httpRequest.request({
                                            url: 'tr_quicksearch.cgi',
                                            params: {
                                                action: 'get_effect'
                                            },
                                            success: function(d){
                                                h.setValue(d.responseText);
                                            },
                                            failure: Testopia.Util.error
                                        });
                                    }
                                }
                            }
                        }]
                    }]
                }]
            
            }, new Testopia.Attachment.Form(), {
                title: 'Components',
                id: 'component_picker',
                height: 250,
                layout: 'fit',
                xtype: 'grid',
                store: new Testopia.TestCase.ComponentStore({
                    product_id: product_id
                }, true),
                columns: [{
                    sortable: true,
                    dataIndex: 'name',
                    width: 500
                }],
                sm: new Ext.grid.RowSelectionModel({
                    singleSelect: false
                }),
                tbar: ['Product', ' ', new Testopia.Product.Combo({
                    mode: 'local',
                    value: product_id,
                    id: 'comp_product_combo'
                })]
            }]
        }],
        buttons: [{
            text: 'Submit',
            handler: function(){
                if (!Ext.getCmp('newcaseform').getForm().isValid()) {
                    return;
                }
                Ext.getCmp('newcaseform').getForm().submit({
                    method: 'POST',
                    success: function(form, data){
                        if (data.result.err) {
                            alert('One or more attachments were either too large or were empty. These have been ignored.');
                        }
                        Ext.Msg.show({
                            title: 'Test Case Created',
                            msg: 'Test case ' + data.result.tc + ' Created. Would you like to go there now?',
                            buttons: Ext.Msg.YESNO,
                            icon: Ext.MessageBox.QUESTION,
                            fn: function(btn){
                                if (btn == 'yes') {
                                    window.location = 'tr_show_case.cgi?case_id=' + data.result.tc;
                                }
                            }
                        });
                        if (Ext.getCmp('plan_case_grid')) {
                            Ext.getCmp('plan_case_grid').store.reload();
                        }
                        else 
                            if (Ext.getCmp('newrun_casegrid')) {
                                Ext.getCmp('newrun_casegrid').store.reload();
                            }
                            else 
                                if (Ext.getCmp('caserun_grid')) {
                                    Ext.getCmp('caserun_grid').store.reload();
                                }
                                else 
                                    if (Ext.getCmp('product_case_grid')) {
                                        Ext.getCmp('product_case_grid').store.reload();
                                    }
                    },
                    failure: Testopia.Util.error
                });
            }
        }, {
            text: 'Cancel',
            id: 'ncf_cancel_btn',
            handler: function(){
                Ext.getCmp('newcaseform').getForm().reset();
                try {
                    if (Ext.getCmp('newcase-win')) {
                        Ext.getCmp('newcase-win').close();
                    }
                    else {
                        window.location = 'tr_show_product.cgi';
                    }
                } 
                catch (err) {
                }
            }
        }]
    });
    Ext.getCmp('comp_product_combo').on('select', function(c, r, i){
        Ext.getCmp('component_picker').store.baseParams.product_id = r.get('id');
        Ext.getCmp('component_picker').store.load();
    });
    Ext.getCmp('component_picker').getSelectionModel().on('rowselect', function(m, i, r){
        Ext.getCmp('compfield').setValue(Testopia.Util.getSelectedObjects(Ext.getCmp('component_picker'), 'id'));
        Ext.getCmp('default_tester').setValue(r.get('qa'));
    });
    Ext.getCmp('ncf_tabs').on('tabchange', function(t, p){
        p.doLayout();
    });
};
Ext.extend(Testopia.TestCase.NewCaseForm, Ext.form.FormPanel);

Testopia.TestCase.NewCasePopup = function(plans, product_id, run_id){
    var win = new Ext.Window({
        id: 'newcase-win',
        closable: true,
        width: Ext.getBody().getViewSize().width - 150,
        height: Ext.getBody().getViewSize().height - 150,
        plain: true,
        shadow: false,
        layout: 'fit',
        items: [new Testopia.TestCase.NewCaseForm(plans, product_id, run_id)]
    });
    win.show(this);
};

Testopia.TestCase.PlanList = function(tcid, product_id){
    this.remove = function(){
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        form.submit({
            url: 'tr_process_case.cgi',
            params: {
                action: 'unlink',
                plan_id: Testopia.Util.getSelectedObjects(Ext.getCmp('case_plan_grid'), 'plan_id'),
                case_id: tcid
            },
            success: function(){
                ds.load();
            },
            failure: Testopia.Util.error
        });
    };
    this.store = new Ext.data.JsonStore({
        url: 'tr_process_case.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getplans',
            case_id: tcid
        },
        root: 'plans',
        id: 'plan_id',
        fields: [{
            name: 'plan_id',
            mapping: 'plan_id'
        }, {
            name: 'plan_name',
            mapping: 'plan_name'
        }]
    });
    var ds = this.store;
    this.columns = [{
        header: 'ID',
        dataIndex: 'plan_id',
        hideable: false,
        renderer: Testopia.Util.makeLink.createDelegate(this,['plan'],true)
    }, {
        header: 'Name',
        width: 150,
        dataIndex: 'plan_name',
        id: 'plan_name',
        sortable: true,
        hideable: false
    }];
    
    var newplan = new Ext.form.ComboBox({
        store: new Testopia.TestPlan.Store({
            product_id: product_id,
            viewall: 1
        }, false),
        loadingText: 'Looking up plans...',
        id: 'link_plan_combo',
        width: 150,
        displayField: 'name',
        valueField: 'plan_id',
        typeAhead: true,
        triggerAction: 'all',
        minListWidth: 300,
        forceSelection: true,
        emptyText: 'Choose a Plan...'
    });
    
    var addButton = new Ext.Button({
        icon: 'extensions/testopia/img/add.png',
        iconCls: 'img_button_16x',
        tooltip: 'Link to plan',
        handler: function(){
            var form = new Ext.form.BasicForm('testopia_helper_frm', {});
            form.submit({
                url: 'tr_process_case.cgi',
                params: {
                    action: 'link',
                    plan_ids: newplan.getValue(),
                    case_id: tcid
                },
                success: function(){
                    ds.load();
                },
                failure: Testopia.Util.error
            });
        }
    });
    
    var deleteButton = new Ext.Button({
        icon: 'extensions/testopia/img/delete.png',
        iconCls: 'img_button_16x',
        tooltip: 'Unlink Selected Plans',
        handler: this.remove
    });
    
    Testopia.TestCase.PlanList.superclass.constructor.call(this, {
        title: 'Plans',
        split: true,
        layout: 'fit',
        autoExpandColumn: "plan_name",
        collapsible: true,
        id: 'case_plan_grid',
        loadMask: {
            msg: 'Loading plans...'
        },
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: true
        }),
        viewConfig: {
            forceFit: true
        },
        tbar: [newplan, addButton, deleteButton]
    });
    
    ds.on('load', function(s, r, o){
        if (s.getCount() == 1) {
            deleteButton.disable();
        }
        else {
            deleteButton.enable();
        }
    });
    
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.TestCase.PlanList, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        grid.getSelectionModel().selectRow(index);
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'tags-ctx-menu',
                items: [{
                    text: 'Unlink Selected Plans',
                    id: 'plan_remove_mnu',
                    icon: 'extensions/testopia/img/delete.png',
                    iconCls: 'img_button_16x',
                    handler: grid.remove
                }, {
                    text: 'Go to Plan',
                    handler: function(){
                        window.location = 'tr_show_plan.cgi?plan_id=' + grid.getSelectionModel().getSelected().get('plan_id');
                    }
                }, {
                    text: 'Refresh',
                    icon: 'extensions/testopia/img/refresh.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        grid.store.reload();
                    }
                }]
            });
        }
        if (this.store.getCount() == 1) {
            Ext.getCmp('plan_remove_mnu').disable();
        }
        else {
            Ext.getCmp('plan_remove_mnu').enable();
        }
        e.stopEvent();
        this.menu.showAt(e.getXY());
    },
    
    onActivate: function(event){
        if (!this.store.getCount()) {
            this.store.load();
        }
    }
});

Testopia.TestCase.Clone = function(product_id, cases){
    var pgrid = new Testopia.TestPlan.Grid({
        product_id: product_id
    }, {
        id: 'plan_clone_grid'
    });
    Testopia.TestCase.Clone.superclass.constructor.call(this, {
        id: 'case-clone-panel',
        layout: 'border',
        items: [{
            region: 'north',
            layout: 'fit',
            border: false,
            height: 300,
            items: [pgrid]
        }, {
            region: 'center',
            xtype: 'form',
            title: 'Clone Options',
            id: 'case_clone_frm',
            border: false,
            frame: true,
            autoScroll: true,
            bodyStyle: 'padding: 10px',
            labelWidth: 250,
            height: 280,
            items: [{
                xtype: 'fieldset',
                autoHeight: true,
                checkboxToggle: true,
                checkboxName: 'copy_cases',
                title: 'Create a copy (Unchecking will create a link to selected plans)',
                id: 'case_copy_method',
                collapsed: true,
                items: [{
                    xtype: 'hidden',
                    id: 'case_copy_plan_ids',
                    name: 'plan_ids'
                }, {
                    xtype: 'hidden',
                    id: 'case_clone_product_id',
                    value: product_id,
                    name: 'product_id'
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'Keep Author (unchecking will make you the author of copied cases)',
                    hideLabel: true,
                    name: 'keep_author',
                    checked: true
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'Keep Default Tester (unchecking will make you the default tester of copied cases)',
                    hideLabel: true,
                    name: 'keep_tester',
                    checked: true
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'Copy case document (action, expected results, etc.)',
                    hideLabel: true,
                    name: 'copy_doc',
                    checked: true
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'Copy Attachments',
                    hideLabel: true,
                    name: 'copy_attachments'
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'Copy Tags',
                    hideLabel: true,
                    name: 'copy_tags',
                    checked: true
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'Copy components',
                    hideLabel: true,
                    name: 'copy_comps',
                    checked: true
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'Copy category to new product',
                    hideLabel: true,
                    disabled: true,
                    id: 'case_clone_category_box',
                    name: 'copy_category',
                    checked: true
                }]
            }]
        }],
        buttons: [{
            text: 'Submit',
            handler: function(){
                Ext.getCmp('case_copy_plan_ids').setValue(Testopia.Util.getSelectedObjects(Ext.getCmp('plan_clone_grid'), 'plan_id'));
                var form = Ext.getCmp('case_clone_frm').getForm();
                var params = form.getValues();
                form.baseParams = {};
                form.baseParams.action = 'clone';
                form.baseParams.ids = cases;
                form.submit({
                    url: 'tr_list_cases.cgi',
                    success: function(form, data){
                        if (params.copy_cases) {
                            if (data.result.tclist.length == 1) {
                                Ext.Msg.show({
                                    title: 'Test Case Copied',
                                    msg: 'Test case ' + data.result.tclist[0] + ' Copied from Case ' + cases + '. Would you like to go there now?',
                                    buttons: Ext.Msg.YESNO,
                                    icon: Ext.MessageBox.QUESTION,
                                    fn: function(btn){
                                        if (btn == 'yes') {
                                            window.location = 'tr_show_case.cgi?case_id=' + data.result.tclist[0];
                                        }
                                    }
                                });
                            }
                            else {
                                Ext.Msg.show({
                                    title: 'Test Case Copied',
                                    msg: data.result.tclist.length + ' Test cases Copied successfully <a href="tr_list_cases.cgi?case_id=' + data.result.tclist.join(',') + '">View List</a>',
                                    buttons: Ext.Msg.OK,
                                    icon: Ext.MessageBox.INFO
                                });
                            }
                        }
                        else {
                            Ext.Msg.show({
                                title: 'Test Case(s) Linked',
                                msg: 'Test cases ' + cases + ' Linked successfully',
                                buttons: Ext.Msg.OK,
                                icon: Ext.MessageBox.INFO
                            });
                        }
                        Ext.getCmp('case-clone-win').close();
                        try {
                            Ext.getCmp('case_plan_grid').store.reload();
                        } 
                        catch (err) {
                        };
                        
                                            },
                    failure: Testopia.Util.error
                });
            }
            
        }, {
            text: 'Cancel',
            handler: function(){
                try {
                    Ext.getCmp('case-clone-win').close();
                } 
                catch (err) {
                    window.location = 'tr_show_product.cgi';
                }
            }
        }]
    });
};
Ext.extend(Testopia.TestCase.Clone, Ext.Panel);

Testopia.TestCase.clonePopup = function(product_id, cases){
    var win = new Ext.Window({
        id: 'case-clone-win',
        closable: true,
        width: 800,
        height: 550,
        plain: true,
        shadow: false,
        layout: 'fit',
        items: [new Testopia.TestCase.Clone(product_id, cases)]
    });
    var pg = Ext.getCmp('plan_clone_grid');
    Ext.apply(pg, {
        title: 'Select plans to clone cases to'
    });
    win.show(this);
    
    var pchooser = new Testopia.Product.Combo({
        id: 'case_clone_win_product_chooser',
        mode: 'local',
        value: product_id
    });
    pchooser.on('select', function(c, r, i){
        pg.store.baseParams = {
            ctype: 'json',
            product_id: r.get('id')
        };
        if (r.get('id') != product_id) {
            Ext.getCmp('case_clone_category_box').enable();
        }
        else {
            Ext.getCmp('case_clone_category_box').disable();
        }
        Ext.getCmp('case_clone_product_id').setValue(r.get('id'));
        pg.store.load();
    });
    pg.getTopToolbar().removeAll();
    pg.getTopToolbar().add('Product: ', pchooser);
    pg.getSelectionModel().un('rowselect', pg.getSelectionModel().events['rowselect'].listeners[0].fn);
    pg.getSelectionModel().un('rowdeselect', pg.getSelectionModel().events['rowdeselect'].listeners[0].fn);
    pg.store.load();
};
