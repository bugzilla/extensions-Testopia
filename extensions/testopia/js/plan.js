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

Testopia.TestPlan.Store = function(params, auto){
    params.ctype = 'json';
    Testopia.TestPlan.Store.superclass.constructor.call(this, {
        url: 'tr_list_plans.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: params,
        totalProperty: 'totalResultsAvailable',
        root: 'Result',
        autoLoad: auto,
        id: 'plan_id',
        fields: [{
            name: "plan_id",
            mapping: "plan_id"
        }, {
            name: "name",
            mapping: "name"
        }, {
            name: "author",
            mapping: "author_name"
        }, {
            name: "creation_date",
            mapping: "creation_date"
        }, {
            name: "product",
            mapping: "product_name"
        }, {
            name: "product_id",
            mapping: "product_id"
        }, {
            name: "prod_version",
            mapping: "default_product_version"
        }, {
            name: "type",
            mapping: "plan_type"
        }, {
            name: "case_count",
            mapping: "case_count"
        }, {
            name: "run_count",
            mapping: "run_count"
        }],
        remoteSort: true
    });
    
    this.paramNames.sort = "order";
};
Ext.extend(Testopia.TestPlan.Store, Ext.data.JsonStore);

Testopia.TestPlan.TypesStore = function(auto){
    Testopia.TestPlan.TypesStore.superclass.constructor.call(this, {
        url: 'tr_quicksearch.cgi',
        root: 'types',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getplantypes'
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
Ext.extend(Testopia.TestPlan.TypesStore, Ext.data.JsonStore);

/*
 * Testopia.TestPlan.TypesCombo
 */
Testopia.TestPlan.TypesCombo = function(cfg){
    Testopia.TestPlan.TypesCombo.superclass.constructor.call(this, {
        id: cfg.id || 'plan_type_combo',
        store: cfg.transform ? false : new Testopia.TestPlan.TypesStore(cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up types...',
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
Ext.extend(Testopia.TestPlan.TypesCombo, Ext.form.ComboBox);

Testopia.TestPlan.Import = function(params){
    var win = new Ext.Window({
        id: 'plan_import_win',
        closable: true,
        width: 450,
        height: 150,
        plain: true,
        shadow: false,
        layout: 'fit',
        items: [{
            xtype: 'form',
            height: 250,
            url: 'tr_importer.cgi',
            id: 'importform',
            baseParams: {
                action: 'upload',
                ctype: 'json',
                plan_id: params.plan_id,
                product_id: params.product_id
            },
            fileUpload: true,
            items: [{
                height: 50,
                style: "padding: 5px",
                border: false,
                html: params.product_id ? PRODUCT_PLAN_IMPORT : PLAN_CASES_IMPORT
            }, {
                xtype: 'field',
                fieldLabel: 'Upload File',
                labelStyle: "padding: 5px",
                inputType: 'file',
                name: 'data',
                width: 300
            }],
            buttons: [{
                text: 'Submit',
                handler: function(){
                    Ext.getCmp('importform').getForm().submit({
                        success: function(){
                            if (params.product_id) {
                                Ext.getCmp('object_panel').activate('product_plan_grid');
                                Ext.getCmp('product_plan_grid').store.load();
                            }
                            else {
                                Ext.getCmp('object_panel').activate('plan_case_grid');
                                Ext.getCmp('plan_case_grid').store.load();
                            }
                            Ext.getCmp('plan_import_win').close();
                        },
                        failure: Testopia.Util.error
                    });
                }
            }]
        }]
    });
    win.show(this);
}

Testopia.TestPlan.Grid = function(params, cfg){
    params.limit = Ext.state.Manager.get('TESTOPIA_DEFAULT_PAGE_SIZE', 25);
    params.current_tab = 'plan';
    this.params = params;
    var versionbox = new Testopia.Product.VersionCombo({
        id: 'plan_grid_version_chooser',
        hiddenName: 'prod_version',
        mode: 'remote',
        params: {
            product_id: params.product_id
        },
        listeners: {
            'startedit': function(){
                var pid = Ext.getCmp(cfg.id || 'plan_grid').getSelectionModel().getSelected().get('product_id');
                if (versionbox.store.baseParams.product_id != pid) {
                    versionbox.store.baseParams.product_id = pid;
                    versionbox.store.load();
                }
            }
        }
    });
    
    this.store = new Testopia.TestPlan.Store(params);
    var ds = this.store;
    
    this.columns = [{
        header: "ID",
        width: 30,
        dataIndex: 'plan_id',
        sortable: true,
        renderer: Testopia.Util.makeLink.createDelegate(this,['plan'],true),
        hideable: false
    }, {
        header: "Name",
        width: 220,
        dataIndex: 'name',
        id: "plan_name",
        sortable: true,
        editor: {
            xtype: 'textfield',
            allowBlank: false
        }
    }, {
        header: "Author",
        width: 150,
        sortable: true,
        dataIndex: 'author'
    }, {
        header: "Created",
        width: 110,
        sortable: true,
        dataIndex: 'creation_date',
        hidden: true
    }, {
        header: "Product",
        width: 180,
        sortable: true,
        dataIndex: 'product',
        hidden: true
    }, {
        header: "Product Version",
        width: 60,
        sortable: true,
        dataIndex: 'prod_version',
        editor: versionbox,
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Type",
        width: 60,
        sortable: true,
        dataIndex: 'type',
        editor: new Testopia.TestPlan.TypesCombo({
            id: 'plan_grid_ types_chooser',
            hiddenName: 'type',
            mode: 'remote'
        }),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Cases",
        width: 20,
        sortable: false,
        dataIndex: 'case_count'
    }, {
        header: "Runs",
        width: 20,
        sortable: false,
        dataIndex: 'run_count'
    }];
    
    this.form = new Ext.form.BasicForm('testopia_helper_frm', {});
    this.bbar = new Testopia.Util.PagingBar('plan', this.store);
    
    Testopia.TestPlan.Grid.superclass.constructor.call(this, {
        title: 'Test Plans',
        id: cfg.id || 'plan_grid',
        layout: 'fit',
        region: 'center',
        stripeRows: true,
        loadMask: {
            msg: 'Loading Test Plans...'
        },
        autoExpandColumn: "plan_name",
        autoScroll: true,
        plugins: [new Ext.ux.grid.RowEditor({
            id:'plan_row_editor',
            saveText: 'Update'
        })],
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: cfg.single || false,
            listeners: {
                'rowselect': function(sm, i, r){
                    if (Ext.getCmp('plan_add_run_mnu')) {
                        Ext.getCmp('plan_add_run_mnu').enable();
                    }
                    if (Ext.getCmp('plan_add_case_mnu')) {
                        Ext.getCmp('plan_add_case_mnu').enable();
                    }
                    if (Ext.getCmp('plan_grid_edit_mnu')) {
                        Ext.getCmp('plan_grid_edit_mnu').enable();
                    }
                    Ext.getCmp('new_run_button').enable();
                    Ext.getCmp('new_case_button').enable();
                    Ext.getCmp('edit_plan_list_btn').enable();
                    if (sm.getCount() > 1) {
                        if (Ext.getCmp('plan_add_run_mnu')) {
                            Ext.getCmp('plan_add_run_mnu').disable();
                        }
                        Ext.getCmp('new_run_button').disable();
                    }
                },
                'rowdeselect': function(sm, i, r){
                    if (sm.getCount() < 1) {
                        Ext.getCmp('new_run_button').disable();
                        Ext.getCmp('new_case_button').disable();
                        Ext.getCmp('edit_plan_list_btn').disable();
                    }
                }
            }
        }),
        enableColumnHide: true,
        tbar: [{
            xtype: 'button',
            text: 'New Run',
            id: 'new_run_button',
            disabled: true,
            handler: this.newRun.createDelegate(this)
        }, {
            xtype: 'button',
            text: 'New Case',
            id: 'new_case_button',
            disabled: true,
            handler: this.newCase.createDelegate(this)
        
        }, new Ext.Toolbar.Fill(), {
            xtype: 'button',
            id: 'save_plan_list_btn',
            icon: 'extensions/testopia/img/save.png',
            iconCls: 'img_button_16x',
            tooltip: 'Save this search',
            handler: function(b, e){
                Testopia.Search.save('plan', Ext.getCmp(cfg.id || 'plan_grid').store.baseParams);
            }
        }, {
            xtype: 'button',
            id: 'link_plan_list_btn',
            icon: 'extensions/testopia/img/link.png',
            iconCls: 'img_button_16x',
            tooltip: 'Create a link to this list',
            handler: function(b, e){
                Testopia.Search.LinkPopup(Ext.getCmp(cfg.id || 'plan_grid').store.baseParams);
            }
        }, {
            xtype: 'button',
            id: 'edit_plan_list_btn',
            icon: 'extensions/testopia/img/edit.png',
            iconCls: 'img_button_16x',
            disabled: true,
            tooltip: 'Edit Selected Test Plan',
            handler: function(){
                Testopia.Util.editFirstSelection(Ext.getCmp(cfg.id || 'plan_grid'));
            }
        }, {
            xtype: 'button',
            id: 'new_plan_list_btn',
            icon: 'extensions/testopia/img/new.png',
            iconCls: 'img_button_16x',
            tooltip: 'Create a New Test Plan',
            handler: function(){
                Testopia.TestPlan.NewPlanPopup(params.product_id);
            }
        }],
        
        viewConfig: {
            forceFit: true
        }
    });
    Ext.apply(this, cfg);
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
    Ext.getCmp('plan_row_editor').on('afteredit', this.onGridEdit, this);
};

Ext.extend(Testopia.TestPlan.Grid, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        grid.selindex = index;
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'plan-ctx-menu',
                enableScrolling: false,
                items: [{
                    text: 'Create a New Test Plan',
                    id: 'plan_menu_new_plan',
                    icon: 'extensions/testopia/img/new.png',
                    iconCls: 'img_button_16x',
                    handler: this.newPlan.createDelegate(this)
                }, {
                    text: 'Add a New Test Run to Selected Plan',
                    id: 'plan_add_run_mnu',
                    handler: this.newRun.createDelegate(this)
                }, {
                    text: 'Add a New Test Case to Selected Plans',
                    id: 'plan_add_case_mnu',
                    handler: this.newCase.createDelegate(this)
                }, {
                    text: 'Edit',
                    id: 'plan_grid_edit_mnu',
                    menu: {
                        enableScrolling: false,
                        items: [{
                            text: 'Type',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Change Plan Type',
                                    id: 'plan_type_win',
                                    layout: 'fit',
                                    split: true,
                                    plain: true,
                                    shadow: false,
                                    listeners: {'afterlayout':function(){Ext.getCmp('plan_type_win_types_combo').focus('',10)}},
                                    width: 350,
                                    height: 150,
                                    items: [new Ext.FormPanel({
                                        labelWidth: '40',
                                        bodyStyle: 'padding: 5px',
                                        items: [new Testopia.TestPlan.TypesCombo({
                                            id: 'plan_type_win_types_combo',
                                            fieldLabel: 'Plan Type'
                                        })]
                                    })],
                                    buttons: [{
                                        text: 'Update Type',
                                        handler: function(){
                                            var params = {
                                                plan_type: Ext.getCmp('plan_type_win_types_combo').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'plan_id')
                                            };
                                            Testopia.Util.updateFromList('plan', params, grid);
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
                            text: 'Tags',
                            handler: function(){
                                Testopia.Tags.update('plan', grid);
                            }
                        }]
                    }
                }, {
                    text: "Reports",
                    menu: {
                        enableScrolling: false,
                        items: [{
                            text: 'New Status Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Status Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_run_reports.cgi?type=status&plan_ids=' + Testopia.Util.getSelectedObjects(grid, 'plan_id');
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    url: newPortlet.url
                                });
                            }
                        }, {
                            text: 'New Completion Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Completion Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_run_reports.cgi?type=completion&plan_ids=' + Testopia.Util.getSelectedObjects(grid, 'plan_id');
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    url: newPortlet.url
                                });
                            }
                        }, {
                            text: 'New Run Execution Report',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Select a date range',
                                    id: 'plan_execution_win',
                                    layout: 'fit',
                                    split: true,
                                    plain: true,
                                    shadow: false,
                                    width: 350,
                                    height: 150,
                                    items: [new Ext.FormPanel({
                                        labelWidth: '40',
                                        bodyStyle: 'padding: 5px',
                                        items: [{
                                            xtype: 'datefield',
                                            id: 'execution_start_date',
                                            fieldLabel: 'Start Date',
                                            name: 'chfieldfrom'
                                        }, {
                                            xtype: 'datefield',
                                            fieldLabel: 'Stop Date',
                                            id: 'execution_stop_date',
                                            emptyText: 'Now',
                                            name: 'chfieldto'
                                        }]
                                    })],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                            
                                            var newPortlet = new Ext.ux.Portlet({
                                                title: 'Execution Report',
                                                closable: true,
                                                autoScroll: true,
                                                tools: PortalTools
                                            });
                                            newPortlet.url = 'tr_run_reports.cgi?type=execution&plan_ids=' + Testopia.Util.getSelectedObjects(grid, 'plan_id') + '&chfieldfrom=' + Ext.getCmp('execution_start_date').getValue() + '&chfieldto=' + Ext.getCmp('execution_stop_date').getValue();
                                            Testopia.Search.dashboard_urls.push(newPortlet.url);
                                            Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                            Ext.getCmp('dashboard_leftcol').doLayout();
                                            newPortlet.load({
                                                url: newPortlet.url
                                            });
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
                            text: 'New Priority Breakdown Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Status Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_run_reports.cgi?type=priority&plan_ids=' + Testopia.Util.getSelectedObjects(grid, 'plan_id');
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    url: newPortlet.url
                                });
                            }
                        }, {
                            text: 'New Bug Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Bug Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_run_reports.cgi?type=bug_grid&plan_ids=' + Testopia.Util.getSelectedObjects(grid, 'plan_id') + '&noheader=1';
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    scripts: true,
                                    url: newPortlet.url
                                });
                            }
                        }, {
                            text: 'Worst Offender Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Worst Offender Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_run_reports.cgi?type=worst&plan_ids=' + Testopia.Util.getSelectedObjects(grid, 'plan_id') + '&noheader=1';
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    scripts: true,
                                    url: newPortlet.url
                                });
                                
                            }
                        }, {
                            text: 'Missing Cases Report',
                            handler: function(){
                                window.open('tr_list_cases.cgi?report_type=missing&plan_ids=' + Testopia.Util.getSelectedObjects(grid, 'plan_id'));
                            }
                        }, {
                            text: 'Case Roll-up Report',
                            handler: function(){
                                window.open('tr_list_caseruns.cgi?report_type=rollup&plan_ids=' + Testopia.Util.getSelectedObjects(grid, 'plan_id'));
                            }
                        }]
                    }
                }, {
                    text: 'Refresh List',
                    icon: 'extensions/testopia/img/refresh.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        grid.store.reload();
                    }
                }, {
                    text: 'View Test Plan(s) in a New Tab',
                    handler: function(){
                        var plan_ids = Testopia.Util.getSelectedObjects(grid, 'plan_id').split(',');
                        var i;
                        for (i = 0; i < plan_ids.length; i += 1) {
                            window.open('tr_show_plan.cgi?plan_id=' + plan_ids[i]);
                        }
                    }
                },{
                    text: 'Export',
                    menu: [{
                        text: 'Test Results as CSV',
                        handler: function(){
                            window.location = 'tr_list_caseruns.cgi?ctype=csv&viewall=1&plan_id=' + Testopia.Util.getSelectedObjects(grid, 'plan_id');
                        }
                    },{
                        text: 'Cases as CSV',
                        handler: function(){
                            window.location='tr_list_cases.cgi?ctype=csv&viewall=1&plan_id=' + Testopia.Util.getSelectedObjects(grid, 'plan_id');
                        }
                    },{
                        text: 'Plans as XML',
                        handler: function(){
                            window.location='tr_list_plans.cgi?ctype=xml&viewall=1&plan_id=' + Testopia.Util.getSelectedObjects(grid, 'plan_id');             
                        }
                    }]
                }]
            });
        }
        e.stopEvent();
        if (grid.getSelectionModel().getCount() < 1) {
            grid.getSelectionModel().selectRow(index);
        }
        this.menu.showAt(e.getXY());
    },
    newPlan: function(){
        Testopia.TestPlan.NewPlanPopup(this.params.product_id);
    },
    newRun: function(){
        Testopia.TestRun.NewRunPopup(this.getSelectionModel().getSelected());
    },
    newCase: function(){
        Testopia.TestCase.NewCasePopup(Testopia.Util.getSelectedObjects(this, 'plan_id'), this.getSelectionModel().getSelected().get('product_id'));
    },
    
    onGridEdit: function(e){
        var ds = this.store;
        var myparams = e.record.data;
        myparams.action = 'edit';
        this.form.submit({
            url: "tr_process_plan.cgi",
            params: myparams,
            success: function(f, a){
                ds.commitChanges();
            },
            failure: function(f, a){
                Testopia.Util.error(f, a);
                ds.rejectChanges();
            }
        });
    },
    onActivate: function(event){
        if (!this.store.getCount()) {
            this.store.load();
        }
    }
});

Testopia.TestPlan.NewPlanForm = function(product_id){
    var versionsBox = new Testopia.Product.VersionCombo({
        id: 'new_plan_form_version_chooser',
        hiddenName: 'prod_version',
        fieldLabel: "<b>Product Version</b>",
        mode: 'local',
        params: {
            product_id: product_id
        }
    });
    var productsBox = new Testopia.Product.Combo({
        id: 'new_plan_form_product_chooser',
        hiddenName: 'product_id',
        fieldLabel: "<b>Product</b>",
        mode: 'local',
        value: product_id
    });
    productsBox.on('select', function(c, r, i){
        versionsBox.reset();
        versionsBox.store.baseParams.product_id = r.get('id');
        versionsBox.store.load();
        versionsBox.enable();
    });
    
    Testopia.TestPlan.NewPlanForm.superclass.constructor.call(this, {
        url: 'tr_new_plan.cgi',
        id: 'new_plan_form',
        baseParams: {
            action: 'add'
        },
        fileUpload: true,
        labelAlign: 'top',
        frame: true,
        title: 'New Plan',
        bodyStyle: 'padding:5px 5px 0',
        width: 800,
        height: 500,
        items: [{
            layout: 'column',
            items: [{
                columnWidth: 0.5,
                layout: 'form',
                items: [{
                    xtype: 'textfield',
                    fieldLabel: '<b>Plan Name</b>',
                    id: 'new_plan_name',
                    name: 'plan_name',
                    anchor: '95%',
                    allowBlank: false
                }, new Testopia.TestPlan.TypesCombo({
                    id: 'new_plan_form_types_chooser',
                    mode: 'local',
                    hiddenName: 'type',
                    fieldLabel: '<b>Plan Type</b>'
                })]
            }, {
                columnWidth: 0.5,
                layout: 'form',
                items: [productsBox, versionsBox]
            }]
        }, {
            xtype: 'tabpanel',
            height: 280,
            activeItem: 0,
            items: [{
                layout: 'fit',
                title: 'Plan Document',
                items: [{
                    id: 'plan_doc',
                    xtype: 'htmleditor',
                    name: 'plandoc'
                }]
            
            }, new Testopia.Attachment.Form()]
        }],
        buttons: [{
            text: 'Submit',
            handler: function(){
                if (!Ext.getCmp('new_plan_form').getForm().isValid()) {
                    return;
                }
                Ext.getCmp('new_plan_form').getForm().submit({
                    success: function(form, data){
                        if (data.result.err) {
                            alert('One or more attachments were either too large or were empty. These have been ignored.');
                        }
                        Ext.Msg.show({
                            title: 'Plan Created',
                            msg: 'Plan ' + data.result.plan + ' Created. Would you like to go there now?',
                            buttons: Ext.Msg.YESNO,
                            icon: Ext.MessageBox.QUESTION,
                            fn: function(btn){
                                if (btn == 'yes') {
                                    window.location = 'tr_show_plan.cgi?plan_id=' + data.result.plan;
                                }
                            }
                        });
                        try {
                            Ext.getCmp('newplan-win').close();
                        } 
                        catch (err) {
                        }
                    },
                    failure: Testopia.Util.error
                });
            }
        }, {
            text: 'Cancel',
            handler: function(){
                if (Ext.getCmp('newplan-win')) {
                    Ext.getCmp('newplan-win').close();
                }
                else {
                    window.location = 'tr_show_product.cgi';
                }
            }
        }]
    });
};

Ext.extend(Testopia.TestPlan.NewPlanForm, Ext.form.FormPanel);

Testopia.TestPlan.NewPlanPopup = function(product_id){
    var win = new Ext.Window({
        id: 'newplan-win',
        closable: true,
        width: 800,
        height: 550,
        plain: true,
        shadow: false,
        layout: 'fit',
        items: [new Testopia.TestPlan.NewPlanForm(product_id)]
    });
    win.show(this);
};
    
Testopia.TestPlan.ClonePanel = function(plan){
    var pbox = new Testopia.Product.Combo({
        id: 'plan_clone_product_chooser',
        hiddenName: 'product_id',
        fieldLabel: 'Copy To Product',
        mode: 'local',
        width: 550,
        value: plan.product_id
    });
    var vbox = new Testopia.Product.VersionCombo({
        id: 'plan_clone_version_chooser',
        hiddenName: 'prod_version',
        fieldLabel: '<b>Product Version</b>',
        params: {
            product_id: plan.product_id
        },
        allowBlank: false
    });
    var bbox = new Testopia.Build.Combo({
        fieldLabel: 'Select a Build',
        id: 'plan_clone_build_chooser',
        mode: 'local',
        hiddenName: 'new_run_build',
        params: {
            product_id: plan.product_id,
            activeonly: 1
        }
    });
    var ebox = new Testopia.Environment.Combo({
        fieldLabel: 'Select an Environment',
        id: 'plan_clone_environment_chooser',
        mode: 'local',
        hiddenName: 'new_run_env',
        params: {
            product_id: plan.product_id,
            isactive: 1
        }
    });
    pbox.on('select', function(c, r, i){
        vbox.reset();
        vbox.store.baseParams.product_id = r.id;
        Ext.getCmp('plan_clone_build_chooser').store.baseParams.product_id = r.id;
        Ext.getCmp('plan_clone_environment_chooser').store.baseParams.product_id = r.id;
        Ext.getCmp('plan_clone_build_chooser').store.load();
        Ext.getCmp('plan_clone_environment_chooser').store.load();
        if (r.id == plan.product_id) {
            Ext.getCmp('copy_categories').disable();
        }
        else {
            Ext.getCmp('copy_categories').enable();
        }
        
        vbox.store.load();
        vbox.enable();
    });
    function doSubmit(){
        var form = this.getForm();
        var p = form.getValues();
        if (form.isValid()) {
            form.submit({
                success: function(f, a){
                    Ext.Msg.show({
                        title: 'Plan Copied',
                        msg: 'Plan ' + a.result.plan_id + ' Created. Would you like to go there now?',
                        buttons: Ext.Msg.YESNO,
                        icon: Ext.MessageBox.QUESTION,
                        fn: function(btn){
                            if (btn == 'yes') {
                                window.location = 'tr_show_plan.cgi?plan_id=' + a.result.plan_id;
                            }
                        }
                    });
                },
                failure: Testopia.Util.error
            })
        }
    }
    Testopia.TestPlan.ClonePanel.superclass.constructor.call(this, {
        id: 'plan_clone_panel',
        url: 'tr_process_plan.cgi',
        baseParams: {
            action: 'clone'
        },
        bodyStyle: 'padding: 10px',
        border: false,
        autoScroll: true,
        width: 600,
        items: [{
            layout: 'table',
            border: false,
            layoutConfig: {
                columns: 2,
                width: '100%'
            },
            items: [{
                colspan: 2,
                layout: 'form',
                border: false,
                items: [{
                    id: 'plan_clone_name',
                    xtype: 'textfield',
                    fieldLabel: '<b>New Plan Name</b>',
                    name: 'plan_name',
                    allowBlank: false,
                    width: 550
                }, pbox, vbox]
            }, {
                layout: 'form',
                border: false,
                items: [{
                    xtype: 'checkbox',
                    name: 'copy_attachments',
                    checked: false,
                    boxLabel: 'Copy Plan Attachments',
                    hideLabel: true
                }, {
                    xtype: 'checkbox',
                    name: 'copy_doc',
                    checked: true,
                    boxLabel: 'Copy Plan Document',
                    hideLabel: true
                }, {
                    xtype: 'hidden',
                    name: 'plan_id',
                    value: plan.plan_id
                }]
            
            }, {
                layout: 'form',
                border: false,
                items: [{
                    xtype: 'checkbox',
                    name: 'copy_tags',
                    checked: true,
                    boxLabel: 'Copy Plan Tags',
                    hideLabel: true
                }, {
                    xtype: 'checkbox',
                    name: 'copy_perms',
                    checked: true,
                    boxLabel: 'Copy Plan Permissions',
                    hideLabel: true
                }]
            
            }, {
                layout: 'form',
                border: false,
                colspan: 2,
                items: [{
                    xtype: 'checkbox',
                    name: 'keep_plan_author',
                    checked: false,
                    boxLabel: 'Maintain original author (unchecking will make me the author of the new plan)',
                    hideLabel: true
                }, {
                    xtype: 'fieldset',
                    autoHeight: true,
                    checkboxToggle: true,
                    checkboxName: 'copy_cases',
                    id: 'copy_cases',
                    title: 'Copy Test Cases',
                    collapsed: true,
                    items: [{
                        xtype: 'checkbox',
                        id: 'case_copy_plan_ids',
                        name: 'make_copy',
                        boxLabel: 'Create a copy (Unchecking will create a link to selected plans)',
                        hideLabel: true,
                        listeners: {
                            'check': function(box, checked){
                                if (checked === true) {
                                    Ext.getCmp('copy_cases_keep_author').enable();
                                    Ext.getCmp('copy_cases_keep_tester').enable();
                                }
                                else {
                                    Ext.getCmp('copy_cases_keep_author').disable();
                                    Ext.getCmp('copy_cases_keep_tester').disable();
                                }
                            }
                        }
                    }, {
                        xtype: 'checkbox',
                        name: 'keep_case_authors',
                        id: 'copy_cases_keep_author',
                        checked: false,
                        disabled: true,
                        boxLabel: 'Maintain original authors (unchecking will make me the author of the copied cases)',
                        hideLabel: true
                    }, {
                        xtype: 'checkbox',
                        id: 'copy_cases_keep_tester',
                        boxLabel: 'Keep Default Tester (unchecking will make you the default tester of copied cases)',
                        hideLabel: true,
                        name: 'keep_tester',
                        checked: true
                    }, {
                        xtype: 'checkbox',
                        name: 'copy_categories',
                        id: 'copy_categories',
                        checked: false,
                        disabled: true,
                        boxLabel: 'Copy Categories to new product (unchecking will place copied cases in the default category for the selected product)',
                        hideLabel: true
                    }]
                }, {
                    xtype: 'fieldset',
                    autoHeight: true,
                    checkboxToggle: true,
                    checkboxName: 'copy_runs',
                    id: 'copy_runs',
                    title: 'Copy Test Runs',
                    collapsed: true,
                    items: [{
                        xtype: 'checkbox',
                        name: 'keep_run_managers',
                        checked: false,
                        boxLabel: 'Maintain managers (unchecking will make me the manager of the new runs)',
                        hideLabel: true
                    }, {
                        xtype: 'checkbox',
                        name: 'copy_run_tags',
                        checked: true,
                        boxLabel: 'Copy tags from the old run to the new run',
                        hideLabel: true
                    }, {
                        xtype: 'checkbox',
                        name: 'copy_run_cases',
                        id: 'copy_run_cases_cbox',
                        checked: true,
                        boxLabel: 'Include test cases (unchecking will produce an empty test run)',
                        hideLabel: true
                    }, bbox, ebox]
                }]
            
            }]
        }],
        buttons: [{
            text: 'Submit',
            handler: doSubmit.createDelegate(this)
        }, {
            text: 'Cancel',
            handler: function(){
                Ext.getCmp('plan-clone-win').close();
            }
        }]
    });
};
Ext.extend(Testopia.TestPlan.ClonePanel, Ext.form.FormPanel);

Testopia.TestPlan.ClonePopup = function(plan){

    var win = new Ext.Window({
        id: 'plan-clone-win',
        closable: true,
        width: 750,
        title: 'Create a Copy of Plan ' + plan.plan_id,
        height: 500,
        plain: true,
        shadow: false,
        closable: true,
        layout: 'fit',
        items: [new Testopia.TestPlan.ClonePanel(plan)]
    });
    win.show();
};
