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

Testopia.TestRun.Grid = function(params, cfg){
    params.limit = Ext.state.Manager.get('TESTOPIA_DEFAULT_PAGE_SIZE', 25);
    params.current_tab = 'run';
    this.params = params;
    this.store = new Ext.data.JsonStore({
        url: 'tr_list_runs.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: params,
        totalProperty: 'totalResultsAvailable',
        root: 'Result',
        id: 'run_id',
        fields: [{
            name: "run_id",
            mapping: "run_id"
        }, {
            name: "plan_id",
            mapping: "plan_id"
        }, {
            name: "summary",
            mapping: "summary"
        }, {
            name: "manager",
            mapping: "manager_name"
        }, {
            name: "start_date",
            mapping: "start_date"
        }, {
            name: "stop_date",
            mapping: "stop_date"
        }, {
            name: "build",
            mapping: "build.name"
        }, {
            name: "environment",
            mapping: "environment.name"
        }, {
            name: "status",
            mapping: "status"
        }, {
            name: "case_count",
            mapping: "case_count"
        }, {
            name: "run_product_version",
            mapping: "product_version"
        }, {
            name: "product_id",
            mapping: "product_id"
        }, {
            name: "passed_pct",
            mapping: "passed_pct"
        }, {
            name: "failed_pct",
            mapping: "failed_pct"
        }, {
            name: "blocked_pct",
            mapping: "blocked_pct"
        }, {
            name: "complete_pct",
            mapping: "complete_pct"
        }, {
            name: "plan_version",
            mapping: "plan_version"
        }, {
            name: "bug_list",
            mapping: "bug_list"
        }],
        remoteSort: true
    });
    var ds = this.store;
    ds.paramNames.sort = "order";
    ds.on('beforeload', function(store, o){
        store.baseParams.ctype = 'json';
    });
    var bcombo = new Testopia.Build.Combo({
        hiddenName: 'build',
        id: 'run_grid_build',
        mode: 'remote',
        params: {
            product_id: params.product_id,
            activeonly: 1
        },
        listeners: {
            'startedit': function(){
                var pid = Ext.getCmp(cfg.id || 'run_grid').getSelectionModel().getSelected().get('product_id');
                if (bcombo.store.baseParams.product_id != pid) {
                    bcombo.store.baseParams.product_id = pid;
                    bcombo.store.load();
                }
            }
        }
    });
    var ecombo = new Testopia.Environment.Combo({
        hiddenName: 'environment',
        id: 'run_grid_env',
        mode: 'remote',
        params: {
            product_id: params.product_id,
            isactive: 1
        },
        listeners: {
            'startedit': function(){
                var pid = Ext.getCmp(cfg.id || 'run_grid').getSelectionModel().getSelected().get('product_id');
                if (ecombo.store.baseParams.product_id != pid) {
                    ecombo.store.baseParams.product_id = pid;
                    ecombo.store.load();
                }
            }
        }
    });
    var vcombo = new Testopia.Product.VersionCombo({
        hiddenName: 'run_product_version',
        id: 'run_grid_version',
        mode: 'remote',
        params: {
            product_id: params.product_id
        },
        listeners: {
            'startedit': function(){
                var pid = Ext.getCmp(cfg.id || 'run_grid').getSelectionModel().getSelected().get('product_id');
                if (vcombo.store.baseParams.product_id != pid) {
                    vcombo.store.baseParams.product_id = pid;
                    vcombo.store.load();
                }
            }
        }
    });
    
    this.columns = [{
        header: "Run ID",
        width: 30,
        dataIndex: "run_id",
        id: "run_id",
        sortable: true,
        renderer: Testopia.Util.makeLink.createDelegate(this,['run'],true),
        hideable: false
    }, {
        header: "Summary",
        width: 220,
        dataIndex: "summary",
        id: "run_name",
        sortable: true,
        editor: {
            xtype: 'textfield',
            allowBlank: false
        }
    }, {
        header: "Manager Name",
        width: 150,
        dataIndex: "manager",
        id: "manager_name_col",
        sortable: true,
        hidden: true,
        editor: new Testopia.User.Lookup({
            hiddenName: 'manager'
        }),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Start Date",
        width: 110,
        dataIndex: "start_date",
        sortable: true,
        hidden: true
    }, {
        header: "Stop Date",
        width: 110,
        dataIndex: "stop_date",
        sortable: true,
        hidden: true
    }, {
        header: "Build",
        width: 110,
        dataIndex: "build",
        id: "build_col",
        sortable: true,
        editor: bcombo,
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Enviroment",
        width: 110,
        dataIndex: "environment",
        id: "environment",
        sortable: true,
        editor: ecombo,
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Status",
        width: 50,
        dataIndex: "status",
        id: "status",
        sortable: true
    }, {
        header: "Case Count",
        width: 30,
        dataIndex: "case_count",
        sortable: false,
        hidden: true
    }, {
        header: "Product Version",
        width: 150,
        dataIndex: "product_version",
        id: "product_version",
        sortable: true,
        hidden: true,
        editor: vcombo,
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Plan ID",
        width: 30,
        dataIndex: "plan_id",
        sortable: true,
        hidden: true,
        renderer: Testopia.Util.makeLink.createDelegate(this,['plan'],true)
    }, {
        header: "Complete",
        width: 110,
        dataIndex: "complete_pct",
        sortable: false,
        hideable: true,
        renderer: function(v, m, r){
            var val = '';
            val = val + '<div class="x-progress-wrap" style="width: 98px; height: 15;">';
            val = val + '    <div style="position: relative;">';
            val = val + '    <div class="x-progress-bar-green" style="width: ' + Math.floor(r.get('passed_pct') * 98) + 'px; height: 14;"></div>';
            val = val + '    <div class="x-progress-bar-red" style="width: ' + Math.floor(r.get('failed_pct') * 98) + 'px; height: 14;"></div>';
            val = val + '    <div class="x-progress-bar-orange" style="width: ' + Math.floor(r.get('blocked_pct') * 98) + 'px; height: 14;"></div>';
            val = val + '    <div class="x-progress-text-main x-hidden" style="font-weight: bold; z-index: 99;">';
            val = val + '        <div style="width: 100px; height: 12px;">' + v + '</div>';
            val = val + '    </div>';
            val = val + '    <div class="x-progress-text-main x-progress-text-back-main" style="font-weight: bold;">';
            val = val + '        <div style="width: 100px; height: 12px;">' + v + '</div>';
            val = val + '    </div>';
            val = val + '    </div>';
            val = val + '</div>';
            return val;
        }
    }];
    
    this.form = new Ext.form.BasicForm('testopia_helper_frm', {});
    this.bbar = new Testopia.Util.PagingBar('run', this.store);
    Testopia.TestRun.Grid.superclass.constructor.call(this, {
        title: 'Test Runs',
        id: cfg.id || 'run_grid',
        loadMask: {
            msg: 'Loading Test Runs...'
        },
        autoExpandColumn: "run_summary",
        autoScroll: true,
        stripeRows: true,
        plugins: [new Ext.ux.grid.RowEditor({
            id:'run_row_editor',
            saveText: 'Update'
        })],
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false,
            listeners: {
                'rowselect': function(sm, i, r){
                    Ext.getCmp('new_case_to_run_button').enable();
                    Ext.getCmp('delete_run_list_btn').enable();
                    Ext.getCmp('edit_run_list_btn').enable();
                },
                'rowdeselect': function(sm, i, r){
                    if (sm.getCount() < 1) {
                        Ext.getCmp('new_case_to_run_button').disable();
                        Ext.getCmp('delete_run_list_btn').disable();
                        Ext.getCmp('edit_run_list_btn').disable();
                    }
                }
            }
        }),
        viewConfig: {
            forceFit: true
        },
        tbar: [{
            xtype: 'button',
            text: 'Add Test Cases to Selected Runs',
            id: 'new_case_to_run_button',
            disabled: true,
            handler: function(){
                var run = Ext.getCmp(cfg.id || 'run_grid').getSelectionModel().getSelected();
                Testopia.TestRun.AddCasePopup(run);
            }
        }, new Ext.Toolbar.Fill(), {
            xtype: 'button',
            id: 'save_run_list_btn',
            icon: 'extensions/testopia/img/save.png',
            iconCls: 'img_button_16x',
            tooltip: 'Save this search',
            handler: function(b, e){
                Testopia.Search.save('run', Ext.getCmp(cfg.id || 'run_grid').store.baseParams);
            }
        }, {
            xtype: 'button',
            id: 'link_run_list_btn',
            icon: 'extensions/testopia/img/link.png',
            iconCls: 'img_button_16x',
            tooltip: 'Create a link to this list',
            handler: function(b, e){
                Testopia.Search.LinkPopup(Ext.getCmp(cfg.id || 'run_grid').store.baseParams);
            }
        }, {
            xtype: 'button',
            id: 'edit_run_list_btn',
            icon: 'extensions/testopia/img/edit.png',
            iconCls: 'img_button_16x',
            disabled: true,
            tooltip: 'Edit Selected Test Run',
            handler: function(){
                Testopia.Util.editFirstSelection(Ext.getCmp(cfg.id || 'run_grid'));
            }
        }, {
            xtype: 'button',
            id: 'add_run_list_btn',
            icon: 'extensions/testopia/img/new.png',
            iconCls: 'img_button_16x',
            tooltip: 'Create a New Test Run',
            handler: function(){
                try {
                    if (plan) {
                        Testopia.TestRun.NewRunPopup(plan);
                    }
                } 
                catch (err) {
                    window.location = 'tr_new_run.cgi';
                }
            }
        }, {
            xtype: 'button',
            id: 'delete_run_list_btn',
            icon: 'extensions/testopia/img/delete.png',
            iconCls: 'img_button_16x',
            disabled: true,
            tooltip: 'Delete Selected Test Runs',
            handler: this.deleteList.createDelegate(this)
        }]
    });
    Ext.apply(this, cfg);
    
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
    Ext.getCmp('run_row_editor').on('afteredit', this.onGridEdit, this);
};

Ext.extend(Testopia.TestRun.Grid, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        grid.selindex = index;
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'run-ctx-menu',
                enableScrolling: false,
                items: [{
                    text: "Reports",
                    menu: {
                        enableScrolling: false,
                        items: [{
                            text: 'New Run Status Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Status Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_run_reports.cgi?type=status&run_ids=' + Testopia.Util.getSelectedObjects(grid, 'run_id');
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    url: newPortlet.url
                                });
                                
                            }
                        }, {
                            text: 'New Run Completion Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Completion Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_run_reports.cgi?type=completion&run_ids=' + Testopia.Util.getSelectedObjects(grid, 'run_id');
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
                                    id: 'run_execution_win',
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
                                        }, new Testopia.User.Lookup({
                                            id: 'exec_tester',
                                            fieldLabel: 'Tester (optional)'
                                        })]
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
                                            newPortlet.url = 'tr_run_reports.cgi?type=execution&run_ids=' + Testopia.Util.getSelectedObjects(grid, 'run_id') + '&chfieldfrom=' + Ext.getCmp('execution_start_date').getValue() + '&chfieldto=' + Ext.getCmp('execution_stop_date').getValue() + '&tester=' + Ext.getCmp('exec_tester').getValue();
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
                                newPortlet.url = 'tr_run_reports.cgi?type=priority&run_ids=' + Testopia.Util.getSelectedObjects(grid, 'run_id');
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    url: newPortlet.url
                                });
                                
                            }
                        }, {
                            text: 'New Run Bug Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Bug Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_run_reports.cgi?type=bug_grid&run_ids=' + Testopia.Util.getSelectedObjects(grid, 'run_id') + '&noheader=1';
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
                                newPortlet.url = 'tr_run_reports.cgi?type=worst&run_ids=' + Testopia.Util.getSelectedObjects(grid, 'run_id') + '&noheader=1';
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    scripts: true,
                                    url: newPortlet.url
                                });
                                
                            }
                        }, {
                            text: 'Case Roll-up Report',
                            handler: function(){
                                window.open('tr_list_caseruns.cgi?report_type=rollup&run_ids=' + Testopia.Util.getSelectedObjects(grid, 'run_id'));
                            }
                        }]
                    }
                }, {
                    text: 'Edit',
                    menu: {
                        items: [{
                            text: 'Manager',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Change Run Manager',
                                    id: 'run_manager_win',
                                    layout: 'fit',
                                    split: true,
                                    plain: true,
                                    shadow: false,
                                    listeners: {'afterlayout':function(){Ext.getCmp('manager_update').focus('',10)}},
                                    width: 350,
                                    height: 150,
                                    items: [new Ext.FormPanel({
                                        labelWidth: '40',
                                        bodyStyle: 'padding: 5px',
                                        items: [new Testopia.User.Lookup({
                                            id: 'manager_update',
                                            fieldLabel: 'Run Manager'
                                        })]
                                    })],
                                    buttons: [{
                                        text: 'Update Manager',
                                        handler: function(){
                                            Testopia.Util.updateFromList('run', {
                                                manager: Ext.getCmp('manager_update').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'run_id')
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
                            text: 'Tags',
                            handler: function(){
                                Testopia.Tags.update('run', grid);
                            }
                        }, {
                            text: 'Targets',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Change Run Targets',
                                    id: 'run_target_win',
                                    layout: 'fit',
                                    split: true,
                                    plain: true,
                                    shadow: false,
                                    listeners: {'afterlayout':function(){Ext.getCmp('target_completion').focus('',10)}},
                                    width: 350,
                                    height: 150,
                                    items: [new Ext.FormPanel({
                                        bodyStyle: 'padding: 5px',
                                        items: [new Ext.form.NumberField({
                                            maxValue: 100,
                                            minValue: 0,
                                            id: 'target_completion',
                                            allowBlank: true,
                                            fieldLabel: 'Target Completion Rate',
                                            hiddenName: 'target_completion',
                                            listeners: {
                                                'valid': function(f){
                                                    Ext.getCmp('target_pass').maxValue = f.getValue();
                                                }
                                            }
                                        }), new Ext.form.NumberField({
                                            maxValue: 100,
                                            minValue: 0,
                                            allowBlank: true,
                                            id: 'target_pass',
                                            fieldLabel: 'Target Pass Rate',
                                            hiddenName: 'target_pass'
                                        })]
                                    })],
                                    buttons: [{
                                        text: 'Update Targets',
                                        handler: function(){
                                            Testopia.Util.updateFromList('run', {
                                                target_pass: Ext.getCmp('target_pass').getValue(),
                                                target_completion: Ext.getCmp('target_completion').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'run_id')
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
                        }]
                    }
                }, {
                    text: 'Clone Selected Test Runs',
                    icon: 'extensions/testopia/img/copy.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        Testopia.TestRun.ClonePopup(grid.getSelectionModel().getSelected().get('product_id'), Testopia.Util.getSelectedObjects(grid, 'run_id'));
                    }
                    
                }, {
                    text: 'Delete Selected Test Runs',
                    icon: 'extensions/testopia/img/delete.png',
                    iconCls: 'img_button_16x',
                    handler: this.deleteList.createDelegate(this)
                
                }, {
                    text: 'Refresh List',
                    icon: 'extensions/testopia/img/refresh.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        grid.store.reload();
                    }
                }, {
                    text: 'View Test Run in a New Window',
                    handler: function(){
                        window.open('tr_show_run.cgi?run_id=' + grid.store.getAt(grid.selindex).get('run_id'));
                    }
                }, {
                    text: 'View Run\'s Test Cases in a New Window',
                    handler: function(){
                        window.open('tr_list_cases.cgi?run_id=' + grid.store.getAt(grid.selindex).get('run_id'));
                    }
                },{
                    text: 'Export Results as CSV',
                    handler: function(){
                        window.location = 'tr_list_caseruns.cgi?ctype=csv&viewall=1&run_id=' + Testopia.Util.getSelectedObjects(grid, 'run_id');
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
        status = myparams.status;
        delete myparams.status;
        var manager;
        if (!myparams.manager.match('@')){
            manager = myparams.manager;
            delete myparams.manager;
        }
        this.form.submit({
            url: "tr_process_run.cgi",
            params: myparams,
            success: function(f, a){
                myparams.manager = manager;
                myparams.status = status;
                ds.commitChanges();
            },
            failure: function(f, a){
                Testopia.Util.error(f, a);
                myparams.manager = manager;
                ds.rejectChanges();
            }
        });
    },
    deleteList: function(){
        var grid = this;
        Ext.Msg.show({
            title: 'Confirm Delete?',
            msg: RUN_DELETE_WARNING,
            buttons: Ext.Msg.YESNO,
            animEl: 'run-delete-btn',
            icon: Ext.MessageBox.QUESTION,
            fn: function(btn){
                if (btn == 'yes') {
                    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm');
                    testopia_form.submit({
                        url: 'tr_list_runs.cgi',
                        params: {
                            run_ids: Testopia.Util.getSelectedObjects(grid, 'run_id'),
                            action: 'delete'
                        },
                        success: function(data){
                            Ext.Msg.show({
                                msg: "Test runs deleted",
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

Testopia.TestRun.NewRunForm = function(plan){
    if (plan.data) {
        plan = plan.data;
    }
    var casegrid = new Testopia.TestCase.Grid({
        plan_id: plan.plan_id,
        case_status: 'CONFIRMED'
    }, {
        title: 'Select From Existing Cases',
        region: 'center',
        id: 'newrun_casegrid',
        height: 500
    });
    this.casegrid = casegrid;
    casegrid.on('render', function(g){
        for (var i = 0; i < g.getTopToolbar().items.length; i++) {
            g.getTopToolbar().items.items[i].destroy();
        }
        g.getTopToolbar().add({
            xtype: 'button',
            text: 'Select All',
            handler: function(){
                casegrid.getSelectionModel().selectAll();
            }
        }, '->', {
            xtype: 'checkbox',
            id: 'selectall'
        }, ' ', ' Include all CONFIRMED Cases in Plan ' + plan.id);
    });
    
    Testopia.TestRun.NewRunForm.superclass.constructor.call(this, {
        url: 'tr_new_run.cgi',
        id: 'newrunform',
        baseParams: {
            action: 'add'
        },
        labelAlign: 'left',
        frame: true,
        title: 'New Run',
        bodyStyle: 'padding:5px 5px 0',
        width: 1050,
        height: 800,
        layout: 'border',
        items: [{
            region: 'north',
            title: 'Filter Cases',
            height: 168,
            collapsible: true,
            listeners: {
                'render': function(p){
                    p.load({
                        url: 'tr_process_plan.cgi',
                        params: {
                            action: 'getfilter',
                            plan_id: plan.plan_id
                        },
                        scripts: true
                    });
                }
            },
            autoShow: true,
            autoScroll: true,
            buttons: [{
                text: 'Filter',
                handler: function(){
                    var filter = new Ext.form.BasicForm('case_filter');
                    var params = filter.getValues();
                    params.plan_id = plan.plan_id;
                    params.status = 'CONFIRMED';
                    casegrid.store.baseParams = params;
                    casegrid.store.load();
                }
            }]
        }, casegrid, {
            region: 'south',
            xtype: 'form',
            url: 'tr_new_run.cgi',
            bodyStyle: 'padding: 10px',
            id: 'newrunsouth',
            height: 200,
            items: [{
                layout: 'column',
                items: [{
                    columnWidth: 0.5,
                    layout: 'form',
                    items: [new Testopia.Product.VersionCombo({
                        fieldLabel: '<b>Product Version</b>',
                        hiddenName: 'prod_version',
                        mode: 'local',
                        forceSelection: true,
                        allowBlank: false,
                        typeAhead: true,
                        params: {
                            product_id: plan.product_id
                        }
                    }), new Testopia.User.Lookup({
                        id: 'new_run_manager',
                        hiddenName: 'manager',
                        fieldLabel: '<b>Run Manager</b>',
                        allowBlank: false
                    }), new Ext.form.NumberField({
                        maxValue: 100,
                        minValue: 0,
                        allowBlank: true,
                        id: 'target_completion',
                        fieldLabel: 'Target Completion Rate',
                        hiddenName: 'target_completion',
                        listeners: {
                            'valid': function(f){
                                Ext.getCmp('target_pass').maxValue = f.getValue();
                            }
                        }
                    })]
                }, {
                    columnWidth: 0.5,
                    layout: 'form',
                    items: [new Testopia.Build.Combo({
                        fieldLabel: '<b>Build</b>',
                        hiddenName: 'build',
                        mode: 'local',
                        forceSelection: false,
                        allowBlank: false,
                        typeAhead: true,
                        params: {
                            product_id: plan.product_id,
                            activeonly: 1
                        },
                        emptyText: 'Select or type a new name'
                    }), new Testopia.Environment.Combo({
                        fieldLabel: '<b>Environment</b>',
                        hiddenName: 'environment',
                        mode: 'local',
                        forceSelection: false,
                        allowBlank: false,
                        typeAhead: true,
                        params: {
                            product_id: plan.product_id,
                            isactive: 1
                        },
                        emptyText: 'Select or type a new name'
                    }), new Ext.form.NumberField({
                        maxValue: 100,
                        minValue: 0,
                        allowBlank: true,
                        id: 'target_pass',
                        fieldLabel: 'Target Pass Rate',
                        hiddenName: 'target_pass'
                    })]
                }]
            }, {
                xtype: 'textfield',
                fieldLabel: '<b>Summary</b>',
                layout: 'fit',
                id: 'run_summary',
                name: 'summary',
                anchor: '100%',
                width: 600,
                allowBlank: false
            }, {
                xtype: 'hidden',
                name: 'plan_id',
                value: plan.plan_id
            }, {
                layout: 'fit',
                fieldLabel: 'Notes',
                id: 'notes',
                xtype: 'textarea',
                width: 600,
                height: 80
            }]
        }],
        buttons: [{
            text: 'Create New Case',
            handler: function(){
                Testopia.TestCase.NewCasePopup(plan.plan_id, plan.product_id);
            }
        }, {
            text: 'Submit',
            handler: function(){
                if (!Ext.getCmp('newrunsouth').getForm().isValid()) {
                    return;
                }
                
                var values = {
                    action: 'add'
                };
                if (Ext.getCmp('selectall').getValue()) {
                    values.getall = Ext.getCmp('selectall').getValue() ? 1 : 0;
                }
                else {
                    values.case_ids = Testopia.Util.getSelectedObjects(casegrid, 'case_id');
                }
                
                if (!Ext.getCmp('build_combo').getValue()) {
                    values.new_build = Ext.getCmp('build_combo').getRawValue();
                }
                if (!Ext.getCmp('environment_combo').getValue()) {
                    values.new_env = Ext.getCmp('environment_combo').getRawValue();
                }
                
                Ext.getCmp('newrunsouth').getForm().submit({
                    params: values,
                    success: function(form, data){
                        Ext.Msg.show({
                            title: 'Test Run Created',
                            msg: 'Test run ' + data.result.run_id + ' Created. Would you like to go there now?',
                            buttons: Ext.Msg.YESNO,
                            icon: Ext.MessageBox.QUESTION,
                            fn: function(btn){
                                if (btn == 'yes') {
                                    window.location = 'tr_show_run.cgi?run_id=' + data.result.run_id;
                                }
                            }
                        });
                        if (Ext.getCmp('plan_run_grid')) {
                            Ext.getCmp('plan_run_grid').store.reload();
                        }
                    },
                    failure: Testopia.Util.error
                });
            }
        }, {
            text: 'Cancel',
            type: 'reset',
            id: 'nrf_cancel_btn',
            handler: function(){
                Ext.getCmp('newrunsouth').getForm().reset();
                try {
                    Ext.getCmp('newRun-win').close();
                } 
                catch (err) {
                    window.location = 'tr_show_product.cgi';
                }
            }
        }]
    });
    this.on('render', function(){
        casegrid.store.load();
        Ext.getCmp('new_run_manager').setValue(Testopia_user.login);
    });
};
Ext.extend(Testopia.TestRun.NewRunForm, Ext.Panel);

Testopia.TestRun.NewRunPopup = function(plan){
    var win = new Ext.Window({
        id: 'newRun-win',
        closable: true,
        width: Ext.getBody().getViewSize().width - 150,
        height: Ext.getBody().getViewSize().height - 150,
        plain: true,
        shadow: false,
        layout: 'fit',
        items: [new Testopia.TestRun.NewRunForm(plan)]
    });
    win.show(this);
};

Testopia.TestRun.CloneForm = function(product_id, runs, caselist){
    var pgrid = new Testopia.TestPlan.Grid({
        product_id: product_id
    }, {
        id: 'run_clone_plan_grid'
    });
    var vbox = new Testopia.Product.VersionCombo({
        id: 'run_clone_version_chooser',
        mode: 'local',
        hiddenName: 'new_run_prod_version',
        fieldLabel: 'Product Version',
        params: {
            product_id: product_id
        }
    });
    var bbox = new Testopia.Build.Combo({
        fieldLabel: 'Select a Build',
        id: 'run_clone_build_chooser',
        mode: 'local',
        hiddenName: 'new_run_build',
        params: {
            product_id: product_id,
            activeonly: 1
        }
    });
    var ebox = new Testopia.Environment.Combo({
        fieldLabel: 'Select an Environment',
        id: 'run_clone_environment_chooser',
        mode: 'local',
        hiddenName: 'new_run_env',
        params: {
            product_id: product_id,
            isactive: 1
        }
    });
    
    function doSubmit(){
        var form = Ext.getCmp('run_clone_frm').getForm();
        form.baseParams = {};
        if (Ext.getCmp('run_copy_cases').collapsed === false){
            switch(Ext.getCmp('copy_cases_radio_group').getGroupValue()){
                case 'copy_filtered_cases':
                    form.baseParams = Ext.getCmp('caserun_search').form.getValues();
                    break;
                 case 'copy_selected_cases':
                    form.baseParams.case_list = Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id');
                    break;
            } 
        }
        form.baseParams.action = 'clone';
        form.baseParams.ids = runs;
        form.baseParams.new_run_build = bbox.getValue();
        form.baseParams.new_run_environment = ebox.getValue();
        form.baseParams.plan_ids = Testopia.Util.getSelectedObjects(pgrid, 'plan_id');
        var p = form.getValues();
        
        if (form.isValid()) {
            form.submit({
                success: function(f, a){
                    var msg;
                    if (a.result.runlist.length == 1) {
                        msg = a.result.failures.length > 0 ? 'Test cases ' + a.result.failures.join(',') + ' were not included. They are either DISABLED or PROPOSED. <br>' : '';
                        Ext.Msg.show({
                            title: 'Run Copied',
                            msg: msg + 'Run ' + a.result.runlist[0] + ' Created. Would you like to go there now?',
                            buttons: Ext.Msg.YESNO,
                            icon: Ext.MessageBox.QUESTION,
                            fn: function(btn){
                                if (btn == 'yes') {
                                    window.location = 'tr_show_run.cgi?run_id=' + a.result.runlist[0];
                                }
                            }
                        });
                    }
                    else {
                        msg = a.result.failures.length > 0 ? a.result.failures.join.length + ' Test cases were not included. They are either DISABLED or PROPOSED. <a href="tr_list_cases.cgi?case_id=' + a.result.failures.join(',') + '">View List</a> <br>' : '';
                        Ext.Msg.show({
                            title: 'Test Run Copied',
                            msg: msg + a.result.runlist.length + ' Test runs Copied successfully. <a href="tr_list_runs.cgi?run_id=' + a.result.runlist.join(',') + '">View List</a>',
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.INFO
                        });
                    }
                },
                failure: Testopia.Util.error
            })
        }
    }
    
    Testopia.TestRun.CloneForm.superclass.constructor.call(this, {
        id: 'run_clone_form',
        border: false,
        width: 600,
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
            url: 'tr_list_runs.cgi',
            title: 'Clone Options',
            autoScroll: true,
            id: 'run_clone_frm',
            border: false,
            frame: true,
            bodyStyle: 'padding: 10px',
            labelWidth: 160,
            height: 350,
            items: [{
                layout: 'table',
                border: false,
                autoScroll: true,
                layoutConfig: {
                    columns: 2,
                    width: '100%'
                },
                items: [{
                    colspan: 2,
                    layout: 'form',
                    border: false,
                    items: [{
                        id: 'run_clone_name',
                        xtype: 'textfield',
                        fieldLabel: 'New Run Summary',
                        name: 'new_run_summary',
                        width: 500
                    }]
                }, {
                    layout: 'form',
                    border: false,
                    items: [vbox, bbox, ebox]
                }, {
                    layout: 'form',
                    border: false,
                    items: [{
                        xtype: 'checkbox',
                        name: 'copy_tags',
                        checked: true,
                        boxLabel: 'Copy Run Tags',
                        hideLabel: true
                    }, {
                        xtype: 'checkbox',
                        name: 'copy_filters',
                        checked: true,
                        boxLabel: 'Copy Run Filters',
                        hideLabel: true
                    }, {
                        xtype: 'hidden',
                        id: 'run_clone_product_id',
                        name: 'product_id',
                        value: product_id
                    }]
                }, {
                    colspan: 2,
                    layout: 'form',
                    border: false,
                    items: [{
                        xtype: 'checkbox',
                        name: 'keep_run_manager',
                        checked: false,
                        boxLabel: 'Maintain original manager (unchecking will make me the manager of the new run)',
                        hideLabel: true
                    }, {
                        xtype: 'fieldset',
                        autoHeight: true,
                        checkboxToggle: true,
                        checkboxName: 'copy_cases',
                        id: 'run_copy_cases',
                        title: 'Copy Test Cases',
                        collapsed: caselist ? false : true,
                        items: [{
                            xtype: 'radio',
                            name: 'copy_cases_options',
                            id: 'copy_cases_radio_group',
                            inputValue: 'copy_all_cases',
                            checked: true,
                            boxLabel: 'Include all CONFIRMED cases in selected run(s)',
                            hideLabel: true
                        }, {
                            xtype: 'radio',
                            name: 'copy_cases_options',
                            inputValue: 'copy_filtered_cases',
                            boxLabel: 'Only include cases that match the selected filter',
                            hideLabel: true
                        }, {
                            xtype: 'radio',
                            name: 'copy_cases_options',
                            inputValue: 'copy_selected_cases',
                            boxLabel: 'Only include cases that are currently selected',
                            checked: caselist ? true : false,
                            hideLabel: true
                        }, {
                            xtype: 'checkbox',
                            name: 'keep_indexes',
                            checked: true,
                            boxLabel: 'Copy Case Indexes',
                            hideLabel: true
                        }, {
                            xtype: 'checkbox',
                            name: 'keep_statuses',
                            boxLabel: 'Maintain status of copied cases (unchecking will set case copies to IDLE (Not Run))',
                            hideLabel: true
                        }]
                    }]
                }]
            }]
        }],
        buttons: [{
            text: 'Submit',
            handler: doSubmit.createDelegate(this)
        }, {
            text: 'Cancel',
            handler: function(){
                Ext.getCmp('run-clone-win').close();
            }
        }]
    });
};
Ext.extend(Testopia.TestRun.CloneForm, Ext.Panel);

Testopia.TestRun.ClonePopup = function(product_id, runs, caselist){
    var win = new Ext.Window({
        id: 'run-clone-win',
        closable: true,
        width: 800,
        height: 600,
        plain: true,
        shadow: false,
        layout: 'fit',
        items: [new Testopia.TestRun.CloneForm(product_id, runs, caselist)]
    });
    var pg = Ext.getCmp('run_clone_plan_grid');
    Ext.apply(pg, {
        title: 'Select plans to clone runs to'
    });
    win.show(this);
    
    var pchooser = new Testopia.Product.Combo({
        id: 'run_clone_win_product_chooser',
        mode: 'local',
        value: product_id
    });
    pchooser.on('select', function(c, r, i){
        pg.store.baseParams = {
            ctype: 'json',
            product_id: r.get('id')
        };
        
        Ext.getCmp('run_clone_version_chooser').reset();
        Ext.getCmp('run_clone_build_chooser').reset();
        Ext.getCmp('run_clone_environment_chooser').reset();
        
        Ext.getCmp('run_clone_version_chooser').store.baseParams.product_id = r.id;
        Ext.getCmp('run_clone_build_chooser').store.baseParams.product_id = r.id;
        Ext.getCmp('run_clone_environment_chooser').store.baseParams.product_id = r.id;
        
        Ext.getCmp('run_clone_version_chooser').store.load();
        Ext.getCmp('run_clone_build_chooser').store.load();
        Ext.getCmp('run_clone_environment_chooser').store.load();
        
        if (r.get('id') != product_id) {
            Ext.getCmp('run_clone_build_chooser').allowBlank = false;
            Ext.getCmp('run_clone_environment_chooser').allowBlank = false;
            Ext.getCmp('run_clone_version_chooser').allowBlank = false;
        }
        else {
            Ext.getCmp('run_clone_build_chooser').allowBlank = true;
            Ext.getCmp('run_clone_environment_chooser').allowBlank = true;
            Ext.getCmp('run_clone_version_chooser').allowBlank = true;
        }
        
        Ext.getCmp('run_clone_product_id').setValue(r.get('id'));
        pg.store.load();
    });
    pg.getTopToolbar().removeAll();
    pg.getTopToolbar().add('Product: ', pchooser);
    pg.getSelectionModel().un('rowselect', pg.getSelectionModel().events['rowselect'].listeners[0].fn);
    pg.getSelectionModel().un('rowdeselect', pg.getSelectionModel().events['rowdeselect'].listeners[0].fn);
    pg.store.load();
};

Testopia.TestRun.AddCaseForm = function(run){
    if (run.data) {
        run = run.data;
    }
    var casegrid = new Testopia.TestCase.Grid({
        plan_id: run.plan_id,
        case_status: 'CONFIRMED',
        exclude: run.run_id
    }, {
        title: 'Select From Existing Cases',
        region: 'center',
        id: 'newrun_casegrid',
        height: 500
    });
    casegrid.on('render', function(g){
        for (var i = 0; i < g.getTopToolbar().items.length; i++) {
            g.getTopToolbar().items.items[i].destroy();
        }
        g.getTopToolbar().add({
            xtype: 'button',
            text: 'Select All',
            handler: function(){
                casegrid.getSelectionModel().selectAll();
            }
        });
        casegrid.store.load();
    });
    
    Testopia.TestRun.AddCaseForm.superclass.constructor.call(this, {
        url: 'tr_new_run.cgi',
        id: 'add_cases_form',
        title: 'Add Cases to Run',
        bodyStyle: 'padding:5px 5px 0',
        width: 1050,
        height: 800,
        layout: 'border',
        items: [{
            region: 'north',
            title: 'Filter Cases',
            height: 172,
            collapsible: true,
            listeners: {
                'render': function(p){
                    p.load({
                        url: 'tr_process_plan.cgi',
                        params: {
                            action: 'getfilter',
                            plan_id: run.plan_id
                        },
                        scripts: true
                    });
                }
            },
            autoShow: true,
            autoScroll: true,
            buttons: [{
                text: 'Filter',
                handler: function(){
                    var filter = new Ext.form.BasicForm('case_filter');
                    var params = filter.getValues();
                    params.plan_id = run.plan_id;
                    params.exclude = run.run_id;
                    params.status = 'CONFIRMED';
                    params.limit = Ext.getCmp('case_pager').pageSize;
                    casegrid.store.baseParams = params;
                    casegrid.store.load();
                }
            }]
        }, casegrid],
        buttons: [{
            text: 'Add Selected Cases to Run',
            handler: function(){
                var form = new Ext.form.BasicForm('testopia_helper_frm');
                form.submit({
                    url: 'tr_list_cases.cgi',
                    params: {
                        action: 'update',
                        addruns: run.run_id,
                        ids: Testopia.Util.getSelectedObjects(casegrid, 'case_id')
                    },
                    success: function(){
                        if (Ext.getCmp('add_case_to_run_win')) {
                            Ext.getCmp('add_case_to_run_win').close();
                        }
                        if (Ext.getCmp('caserun_grid')) {
                            Ext.getCmp('caserun_grid').store.reload();
                        }
                    },
                    failure: Testopia.Util.error
                });
            }
        }]
    });
};
Ext.extend(Testopia.TestRun.AddCaseForm, Ext.Panel);

Testopia.TestRun.AddCasePopup = function(run){
    var win = new Ext.Window({
        id: 'add_case_to_run_win',
        closable: true,
        width: Ext.getBody().getViewSize().width - 150,
        height: Ext.getBody().getViewSize().height - 150,
        plain: true,
        shadow: false,
        layout: 'fit',
        items: [new Testopia.TestRun.AddCaseForm(run)]
    });
    win.show(this);
};

Testopia.TestRun.FiltersList = function(run){

    this.store = new Ext.data.JsonStore({
        url: 'tr_process_run.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getfilters',
            run_id: run.run_id
        },
        root: 'filters',
        fields: ["name", "query"]
    });
    var ds = this.store;
    
    this.columns = [{
        header: "Name",
        width: 30,
        dataIndex: "name",
        sortable: true
    }];
    
    Testopia.TestRun.FiltersList.superclass.constructor.call(this, {
        title: "Filters",
        id: "run_filter_grid",
        loadMask: {
            msg: "Loading Filters ..."
        },
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: true,
            listeners: {
                'rowselect': function(sm, index, r){
                    var name = r.get('name');
                    Ext.getCmp('object_panel').setActiveTab('caserun-panel');
                    var params = Testopia.Util.urlQueryToJSON(r.get('query'));
                    var f = document.getElementById('caserun_filter_form');
                    for (var i = 0; i < f.length; i++) {
                        if (f[i].type == 'select-multiple') {
                            for (var k = 0; k < f[i].options.length; k++) {
                                f[i].options[k].selected = false;
                            }
                            
                            var list = params[f[i].name];
                            if (!list) {
                                continue;
                            }
                            if (typeof list != 'object') {
                                list = new Array(list);
                            }
                            for (j = 0; j < list.length; j++) {
                                for (k = 0; k < f[i].options.length; k++) {
                                    if (f[i].options[k].value == list[j]) {
                                        f[i].options[k].selected = true;
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            f[i].value = params[f[i].name];
                        }
                    }
                    Ext.getCmp('caserun_grid').store.baseParams = params;
                    Ext.getCmp('caserun_grid').store.load();
                }
            }
        }),
        viewConfig: {
            forceFit: true
        }
    });
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.TestRun.FiltersList, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'run_filter_ctx',
                items: [{
                    text: 'Delete Saved Filter',
                    handler: function(){
                        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
                        form.submit({
                            url: 'tr_process_run.cgi',
                            params: {
                                action: 'delete_filter',
                                query_name: grid.store.getAt(index).get('name'),
                                run_id: grid.store.baseParams.run_id
                            },
                            success: function(){
                                Testopia.Util.notify.msg('Filter removed', 'filter removed successfully');
                                grid.store.reload();
                            },
                            failure: Testopia.Util.error
                        });
                    }
                }]
            });
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

Testopia.BugReport = function(params){
    params.type = 'bug';
    this.store = new Ext.data.GroupingStore({
        url: 'tr_run_reports.cgi',
        baseParams: params,
        reader: new Ext.data.JsonReader({
            root: 'Result',
            fields: [{
                name: "case_id",
                mapping: "case_id"
            }, {
                name: "run_id",
                mapping: "run_id"
            }, {
                name: "bug_id",
                mapping: "bug_id"
            }, {
                name: "case_status",
                mapping: "case_status"
            }, {
                name: "bug_status",
                mapping: "bug_status"
            }, {
                name: "severity",
                mapping: "bug_severity"
            }]
        }),
        remoteSort: false,
        sortInfo: {
            field: 'run_id',
            direction: "ASC"
        },
        groupField: 'bug_id'
    });
    this.store.isTreport = true;
    this.view = new Ext.grid.GroupingView({
        forceFit: true,
        groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})'
    });
    this.columns = [{
        header: 'Run',
        dataIndex: 'run_id',
        sortable: true,
        hideable: true,
        groupRenderer: function(v){
            return v;
        },
        renderer: Testopia.Util.makeLink.createDelegate(this,['run'],true)
    }, {
        header: 'Case',
        dataIndex: 'case_id',
        sortable: true,
        hideable: true,
        groupRenderer: function(v){
            return v;
        },
        renderer: Testopia.Util.makeLink.createDelegate(this,['case'],true)
    }, {
        header: 'Bug',
        dataIndex: 'bug_id',
        sortable: true,
        hideable: true,
        groupRenderer: function(v){
            return v;
        },
        renderer: Testopia.Util.makeLink.createDelegate(this,['bug'],true)
    }, {
        header: 'Bug Status',
        dataIndex: 'bug_status',
        sortable: true,
        hideable: true
    }, {
        header: 'Case Status',
        dataIndex: 'case_status',
        sortable: true,
        hideable: true
    }, {
        header: 'Severity',
        dataIndex: 'severity',
        sortable: true,
        hideable: true
    }];
    Testopia.BugReport.superclass.constructor.call(this, {
        sm: new Ext.grid.RowSelectionModel(),
        layout: 'fit',
        height: 250,
        autoScroll: true
    });
};
Ext.extend(Testopia.BugReport, Ext.grid.GridPanel);

/*
 * Testopia.TestRun.ProgressBar - Create a multicolored version of the Ext ProgressBar.
 */
Testopia.TestRun.ProgressBar = function(cfg){
    Testopia.TestRun.ProgressBar.superclass.constructor.call(this, cfg);
};
Ext.extend(Testopia.TestRun.ProgressBar, Ext.ProgressBar, {
    onRender: function(ct, position){
        Ext.ProgressBar.superclass.onRender.call(this, ct, position);
        
        var tpl = new Ext.Template('<div class="{cls}-wrap">', '<div style="position:relative">', '<div class="{cls}-bar-green"></div>', '<div class="{cls}-bar-red"></div>', '<div class="{cls}-bar-orange"></div>', '<div class="{cls}-text-main" style="font-weight: bold">', '<div>&#160;</div>', '</div>', '<div class="{cls}-text-main {cls}-text-back-main" style="font-weight: bold">', '<div>&#160;</div>', '</div>', '</div>', '</div>');
        
        if (position) {
            this.el = tpl.insertBefore(position, {
                cls: this.baseCls
            }, true);
        }
        else {
            this.el = tpl.append(ct, {
                cls: this.baseCls
            }, true);
        }
        if (this.id) {
            this.el.dom.id = this.id;
        }
        this.progressBar = Ext.get(this.el.dom.firstChild);
        this.gbar = Ext.get(this.progressBar.dom.firstChild);
        this.rbar = Ext.get(this.gbar.dom.nextSibling);
        this.obar = Ext.get(this.rbar.dom.nextSibling);
        
        if (this.textEl) {
            //use an external text el
            this.textEl = Ext.get(this.textEl);
            delete this.textTopEl;
        }
        else {
            //setup our internal layered text els
            this.textTopEl = Ext.get(this.progressBar.dom.childNodes[3]);
            var textBackEl = Ext.get(this.progressBar.dom.childNodes[4]);
            this.textTopEl.setStyle("z-index", 99).addClass('x-hidden');
            this.textEl = new Ext.CompositeElement([this.textTopEl.dom.firstChild, textBackEl.dom.firstChild]);
            this.textEl.setWidth(this.progressBar.offsetWidth);
        }
        if (this.gvalue || this.rvalue || this.ovalue) {
            this.updateProgress(this.gvalue, this.rvalue, this.ovalue, this.text);
        }
        else {
            this.updateText(this.text);
        }
        this.setSize(this.width || 'auto', 'auto');
        this.progressBar.setHeight(this.progressBar.offsetHeight);
    },
    updateProgress: function(gvalue, rvalue, ovalue, text){
        this.gvalue = gvalue || 0;
        this.rvalue = rvalue || 0;
        this.ovalue = ovalue || 0;
        if (text) {
            this.updateText(text);
        }
        var gw = Math.floor(gvalue * this.el.dom.firstChild.offsetWidth);
        var rw = Math.floor(rvalue * this.el.dom.firstChild.offsetWidth);
        var ow = Math.floor(ovalue * this.el.dom.firstChild.offsetWidth);
        this.gbar.setWidth(gw);
        this.rbar.setWidth(rw);
        this.obar.setWidth(ow);
        
        return this;
    },
    setSize: function(w, h){
        Ext.ProgressBar.superclass.setSize.call(this, w, h);
        if (this.textTopEl) {
            this.textEl.setSize(this.el.dom.offsetWidth, this.el.dom.offsetHeight);
        }
        return this;
    }
});
