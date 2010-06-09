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

Testopia.TestCaseRun.StatusListStore = function(auto){
    Testopia.TestCaseRun.StatusListStore.superclass.constructor.call(this, {
        url: 'tr_quicksearch.cgi',
        root: 'statuses',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getcaserunstatus'
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
Ext.extend(Testopia.TestCaseRun.StatusListStore, Ext.data.JsonStore);

/*
 * Testopia.TestCaseRun.StatusListCombo
 */
Testopia.TestCaseRun.StatusListCombo = function(cfg){
    Testopia.TestCaseRun.StatusListCombo.superclass.constructor.call(this, {
        id: cfg.id || 'case_run_status_combo',
        store: cfg.transform ? false : new Testopia.TestCaseRun.StatusListStore(cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up statuses...',
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
Ext.extend(Testopia.TestCaseRun.StatusListCombo, Ext.form.ComboBox);

Testopia.TestCaseRun.Panel = function(params, run){
    var cgrid = new Testopia.TestCaseRun.Grid(params, run);
    var filter = new Testopia.TestCaseRun.Filter();
    var cr = new Testopia.TestCaseRun.Info();
    this.cgrid = cgrid;
    this.store = cgrid.store;
    this.params = params;
    this.caserun = cr;
    
    Testopia.TestCaseRun.Panel.superclass.constructor.call(this, {
        layout: 'border',
        title: 'Test Cases',
        id: 'caserun-panel',
        border: false,
        bodyBorder: false,
        items: [filter, cgrid, cr]
    });
    cr.disable();
    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.TestCaseRun.Panel, Ext.Panel, {
    onActivate: function(event){
        this.store.load();
    }
});

Testopia.TestCaseRun.Filter = function(){
    this.form = new Ext.form.BasicForm('caserun_filter_form', {});
    var searchform = this.form;
    Testopia.TestCaseRun.Filter.superclass.constructor.call(this, {
        title: 'Search for Test Results',
        id: 'caserun_search',
        region: 'north',
        border: false,
        bodyBorder: false,
        layout: 'fit',
        split: true,
        frame: true,
        collapsible: true,
        height: 'auto',
        autoScroll: true,
        contentEl: 'caserun-filter-div',
        buttons: [new Ext.form.TextField({
            id: 'caserun_save_filter_txt',
            validateOnBlur: false,
            allowBlank: false
        }), {
            text: 'Save Filter',
            handler: function(){
                if (!Ext.getCmp('caserun_save_filter_txt').isValid()) {
                    Ext.Msg.show({
                        title: 'Invalid Entry',
                        msg: 'Please enter a name for this filter',
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.WARNING
                    });
                    return false;
                }
                var testopia_form = new Ext.form.BasicForm('testopia_helper_frm', {});
                var params = searchform.getValues();
                params.action = 'save_filter';
                params.query_name = Ext.getCmp('caserun_save_filter_txt').getValue();
                testopia_form.submit({
                    url: 'tr_process_run.cgi',
                    params: params,
                    success: function(){
                        Ext.getCmp('run_east_panel').activate('run_filter_grid');
                        Ext.getCmp('run_filter_grid').store.reload();
                        Testopia.Util.notify.msg('Filter Saved', 'Added filter {0}', params.query_name);
                    },
                    failure: Testopia.Util.error
                });
            }
        },        //        new Ext.Toolbar.Fill(),
        {
            text: 'Reset',
            handler: function(){
                document.getElementById('caserun_filter_form').reset();
                var ds = Ext.getCmp('caserun_grid').store;
                var run_id = ds.baseParams.run_id;
                var ctype = ds.baseParams.ctype;
                
                ds.baseParams = {};
                ds.baseParams.run_id = run_id;
                ds.baseParams.ctype = ctype;
                ds.baseParams.limit = Ext.getCmp('caserun_pager').pageSize;
                
                ds.load({
                    callback: function(){
                        Ext.getCmp('caserun_filtered_txt').hide();
                        Ext.getCmp('run_filter_grid').getSelectionModel().clearSelections();
                        if (Ext.getCmp('caserun_grid').getSelectionModel().getCount() < 1) {
                            Ext.getCmp('caserun-panel').caserun.disable();
                        }
                    }
                });
            }
        }, {
            text: 'Filter',
            handler: function(){
                var ds = Ext.getCmp('caserun_grid').store;
                ds.baseParams = searchform.getValues();
                ds.baseParams.limit = Ext.getCmp('caserun_pager').pageSize;
                ds.baseParams.distinct = 1;
                ds.load({
                    callback: function(){
                        Ext.getCmp('caserun_filtered_txt').show();
                        if (Ext.getCmp('caserun_grid').getSelectionModel().getCount() < 1) {
                            Ext.getCmp('caserun-panel').caserun.disable();
                        }
                    }
                });
            }
        }]
    });
};
Ext.extend(Testopia.TestCaseRun.Filter, Ext.Panel);

Testopia.TestCaseRun.List = function(params, cfg){
    this.params = params;
    this.store = new Ext.data.GroupingStore({
        url: 'tr_list_caseruns.cgi',
        baseParams: params,
        reader: new Ext.data.JsonReader({
            totalProperty: 'totalResultsAvailable',
            root: 'Result',
            id: 'caserun_id',
            fields: [{
                name: "caserun_id",
                mapping: "case_run_id"
            }, {
                name: "case_id",
                mapping: "case_id"
            }, {
                name: "run_id",
                mapping: "run_id"
            }, {
                name: "build",
                mapping: "build_name"
            }, {
                name: "environment",
                mapping: "env_name"
            }, {
                name: "assignee",
                mapping: "assignee_name"
            }, {
                name: "testedby",
                mapping: "testedby"
            }, {
                name: "status",
                mapping: "status"
            }, {
                name: "category",
                mapping: "category"
            }, {
                name: "priority",
                mapping: "priority"
            }, {
                name: "close_date",
                mapping: "close_date"
            }, {
                name: "bug_count",
                mapping: "bug_count"
            }, {
                name: "case_summary",
                mapping: "case_summary"
            }, {
                name: "component",
                mapping: "component"
            }, {
                name: "bug_list",
                mapping: "bug_list"
            }, {
                name: "case_bug_list",
                mapping: "case_bug_list"
            }, {
                name: "plan_name", 
                mapping:"plan_name"
            }]
        }),
        remoteSort: true,
        sortInfo: {
            field: 'run_id',
            direction: "ASC"
        },
        groupField: 'run_id'
    });
    var ds = this.store;
    ds.paramNames.sort = "order";
    ds.on('beforeload', function(store, o){
        store.baseParams.ctype = 'json';
    });
    this.summary_sort = function(){
        this.store.sortInfo.field = 'summary';
        this.store.sortInfo.direction == 'DESC' ? this.store.sortInfo.direction = 'ASC' : this.store.sortInfo.direction = 'DESC';
        this.getView().mainHd.select('td').removeClass(this.getView().sortClasses);
        this.store.load();
    };
    this.bbar = new Testopia.Util.PagingBar('caserun', this.store);
    this.columns = [{
        header: "Case",
        width: 50,
        dataIndex: 'case_id',
        sortable: true,
        groupRenderer: function(v){
            return v;
        },
        renderer: Testopia.Util.makeLink.createDelegate(this,['case'],true)
    }, {
        header: "Run",
        width: 50,
        dataIndex: 'run_id',
        sortable: true,
        groupRenderer: function(v){
            return v;
        },
        renderer: Testopia.Util.makeLink.createDelegate(this,['run'],true)
    }, {
        header: "Build",
        width: 50,
        dataIndex: 'build',
        sortable: true,
        id: 'caserun_list_build_col'
    }, {
        header: "Environment",
        width: 50,
        dataIndex: 'environment',
        sortable: true
    }, {
        header: "Assignee",
        width: 150,
        sortable: true,
        dataIndex: 'assignee'
    }, {
        header: "Tested By",
        width: 150,
        sortable: true,
        dataIndex: 'testedby'
    }, {
        header: "Status",
        width: 30,
        sortable: true,
        dataIndex: 'status',
        groupRenderer: function(v){
            return v;
        },
        renderer: Testopia.Util.displayStatusIcon
    }, {
        header: "Closed",
        width: 60,
        sortable: true,
        dataIndex: 'close_date'
    }, {
        header: "Priority",
        width: 60,
        sortable: true,
        dataIndex: 'priority'
    }, {
        header: "Category",
        width: 100,
        sortable: true,
        dataIndex: 'category'
    }, {
        header: "Component",
        width: 100,
        sortable: true,
        dataIndex: 'component'
    },{
        header: "Plan Name",
        width: 100,
        sortable: true,
        hidden: true,
        dataIndex: 'plan_name'
    }, {
        header: "Bugs In This Build and Environment",
        width: 100,
        dataIndex: "bug_list",
        sortable: false,
        hideable: true,
        renderer: function(v){
            var bugs = v.bugs;
            var rets = '';
            for (var i = 0; i < bugs.length; i++) {
                if (typeof bugs[i] != 'function') {
                    rets = rets + '<a href="show_bug.cgi?id=' + bugs[i].bug_id + '" ' + (bugs[i].closed ? 'class="bz_closed"' : '') + '>' + bugs[i].bug_id + '</a>, ';
                }
                
            }
            return rets;
        }
    }, {
        header: "Bugs In All Builds and Environments",
        width: 100,
        dataIndex: "case_bug_list",
        sortable: false,
        hideable: true,
        renderer: function(v){
            var bugs = v.bugs;
            var rets = '';
            for (var i = 0; i < bugs.length; i++) {
                if (typeof bugs[i] != 'function') {
                    rets = rets + '<a href="show_bug.cgi?id=' + bugs[i].bug_id + '" ' + (bugs[i].closed ? 'class="bz_closed"' : '') + '>' + bugs[i].bug_id + '</a>, ';
                }
                
            }
            return rets;
        }
    }];
    this.view = new Ext.grid.GroupingView({
        forceFit: true,
        groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})',
        enableRowBody: true,
        getRowClass: function(record, rowIndex, p, ds){
            p.body = '<p><a href="javascript:Ext.getCmp(\'caserun_list_grid\').summary_sort()">Summary:</a> ' + record.data.case_summary + '</p>';
            return 'x-grid3-row-expanded';
        }
    });
    this.tbar = [new Ext.Toolbar.Fill(), 
    {
        xtype: 'button',
        id: 'caserun_grid_tocsv',
        icon: 'extensions/testopia/img/csv.png',
        iconCls: 'img_button_16x',
        tooltip: 'Export Results to CSV',
        handler: function(){
            window.location = 'tr_list_caseruns.cgi?ctype=csv&viewall=1&' + Testopia.Util.JSONToURLQuery( Ext.getCmp(cfg.id || 'caserun_list_grid').store.baseParams, '', ['viewall', 'ctype']);
        }
    },{
        xtype: 'button',
        id: 'save_caserun_list_btn',
        icon: 'extensions/testopia/img/save.png',
        iconCls: 'img_button_16x',
        tooltip: 'Save this search',
        handler: function(b, e){
            Testopia.Search.save('caserun', Ext.getCmp(cfg.id || 'caserun_list_grid').store.baseParams);
        }
    }, {
        xtype: 'button',
        id: 'link_case_list_btn',
        icon: 'extensions/testopia/img/link.png',
        iconCls: 'img_button_16x',
        tooltip: 'Create a link to this list',
        handler: function(b, e){
            Testopia.Search.LinkPopup(Ext.getCmp(cfg.id || 'caserun_list_grid').store.baseParams);
        }
    }];
    
    Testopia.TestCaseRun.List.superclass.constructor.call(this, {
        id: cfg.id || 'caserun_list_grid',
        title: 'Case Run History',
        loadMask: {
            msg: 'Loading Test Cases...'
        },
        layout: 'fit',
        region: 'center',
        stripeRows: true,
        autoExpandColumn: "caserun_list_build_col",
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false
        }),
        viewConfig: {
            forceFit: true
        }
    });
    Ext.apply(this, cfg);
    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.TestCaseRun.List, Ext.grid.GridPanel, {
    deleteList: function(){
        var grid = this;
        Ext.Msg.show({
            title: 'Confirm Delete?',
            msg: CASERUN_DELETE_WARNING,
            buttons: Ext.Msg.YESNO,
            animEl: 'caserun-delete-btn',
            icon: Ext.MessageBox.QUESTION,
            fn: function(btn){
                if (btn == 'yes') {
                    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm');
                    testopia_form.submit({
                        url: 'tr_list_caseruns.cgi',
                        params: {
                            caserun_ids: Testopia.Util.getSelectedObjects(grid, 'caserun_id'),
                            action: 'delete',
                            deltype: 'cr',
                            single: true,
                            ctype: 'json'
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
        });
    },
    onActivate: function(event){
        if (!this.store.getCount()) {
            this.store.load();
        }
    }
});

Testopia.TestCaseRun.Grid = function(params, run){
    params.limit = Ext.state.Manager.get('TESTOPIA_DEFAULT_PAGE_SIZE', 25);
    this.params = params;
    this.run = run;
    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm', {});
    var selected;
    this.summary_sort = function(){
        this.store.sortInfo.field = 'summary';
        this.store.sortInfo.direction == 'DESC' ? this.store.sortInfo.direction = 'ASC' : this.store.sortInfo.direction = 'DESC';
        this.getView().mainHd.select('td').removeClass(this.getView().sortClasses);
        this.store.load();
    };
    
    envRenderer = function(v, md, r, ri, ci, s){
        var f = this.getColumnModel().getCellEditor(ci, ri).field;
        record = f.store.getById(v);
        if (record) {
            return '<a href="tr_environments.cgi?env_id=' + record.data[f.valueField] + '">' + record.data[f.displayField] + '</a>';
        }
        else {
            return '<a href="tr_environments.cgi?env_id=' + r.data.env_id + '">' + v + '</a>';
        }
    };
    this.store = new Ext.data.GroupingStore({
        url: 'tr_list_caseruns.cgi',
        baseParams: params,
        reader: new Ext.data.JsonReader({
            totalProperty: 'totalResultsAvailable',
            root: 'Result',
            id: 'caserun_id',
            fields: [{
                name: "caserun_id",
                mapping: "case_run_id"
            }, {
                name: "sortkey",
                mapping: "sortkey"
            }, {
                name: "case_id",
                mapping: "case_id"
            }, {
                name: "run_id",
                mapping: "run_id"
            }, {
                name: "build",
                mapping: "build_name"
            }, {
                name: "environment",
                mapping: "env_name"
            }, {
                name: "env_id",
                mapping: "env_id"
            }, {
                name: "assignee",
                mapping: "assignee_name"
            }, {
                name: "testedby",
                mapping: "testedby"
            }, {
                name: "status",
                mapping: "status"
            }, {
                name: "requirement",
                mapping: "requirement"
            }, {
                name: "category",
                mapping: "category"
            }, {
                name: "priority",
                mapping: "priority"
            }, {
                name: "close_date",
                mapping: "close_date"
            }, {
                name: "bug_count",
                mapping: "bug_count"
            }, {
                name: "case_summary",
                mapping: "case_summary"
            }, {
                name: "type",
                mapping: "type"
            }, {
                name: "id",
                mapping: "id"
            }, {
                name: "component",
                mapping: "component"
            }, {
                name: "bug_list",
                mapping: "bug_list"
            }, {
                name: "case_bug_list",
                mapping: "case_bug_list"
            }, {
                name: "plan_name", 
                mapping:"plan_name"
            }]
        }),
        remoteSort: true,
        sortInfo: {
            field: 'sortkey',
            direction: "ASC"
        },
        groupField: 'run_id'
    });
    var ds = this.store;
    ds.paramNames.sort = "order";
    ds.on('beforeload', function(store, o){
        store.baseParams.ctype = 'json';
    });
    
    var buildCombo = new Testopia.Build.Combo({
        id: 'tb_build',
        width: 100,
        fieldLabel: 'Build',
        hiddenName: 'build',
        mode: 'remote',
        forceSelection: false,
        allowBlank: false,
        typeAhead: true,
        disabled: true,
        params: {
            product_id: run.plan.product_id,
            activeonly: 1
        }
    });
    var envCombo = new Testopia.Environment.Combo({
        id: 'tb_environment',
        width: 100,
        fieldLabel: 'Environment',
        hiddenName: 'environment',
        mode: 'remote',
        forceSelection: false,
        allowBlank: false,
        typeAhead: true,
        disabled: true,
        params: {
            product_id: run.plan.product_id,
            isactive: 1
        }
    });
    buildCombo.on('select', function(c, r, i){
        params = {
            build_id: r.get('build_id'),
            ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
        };
        Testopia.Util.updateFromList('caserun', params, Ext.getCmp('caserun_grid'));
    });
    envCombo.on('select', function(c, r, i){
        params = {
            env_id: r.get('environment_id'),
            ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
        };
        Testopia.Util.updateFromList('caserun', params, Ext.getCmp('caserun_grid'));
    });
    this.object_type = 'environment';
    this.columns = [{
        header: "Case",
        width: 50,
        dataIndex: 'case_id',
        sortable: true,
        renderer: Testopia.Util.makeLink.createDelegate(this,['case'],true)
    }, {
        header: "Run",
        width: 50,
        dataIndex: 'run_id',
        sortable: true,
        renderer: Testopia.Util.makeLink.createDelegate(this,['run'],true),
        hidden: true
    }, {
        header: "Index",
        width: 50,
        dataIndex: 'sortkey',
        sortable: true,
        editor: new Ext.grid.GridEditor(new Ext.form.NumberField())
    }, {
        header: "Build",
        width: 50,
        dataIndex: 'build',
        sortable: true,
        editor: new Ext.grid.GridEditor(new Testopia.Build.Combo({
            params: {
                product_id: run.plan.product_id,
                activeonly: 1
            }
        })),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Environment",
        width: 50,
        dataIndex: 'environment',
        sortable: true,
        editor: new Ext.grid.GridEditor(new Testopia.Environment.Combo({
            params: {
                product_id: run.plan.product_id,
                isactive: 1
            }
        })),
        renderer: envRenderer.createDelegate(this)
    }, {
        header: "Assignee",
        width: 150,
        sortable: true,
        dataIndex: 'assignee',
        editor: new Ext.grid.GridEditor(new Testopia.User.Lookup({
            id: 'caserun_assignee'
        })),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Tested By",
        width: 150,
        sortable: true,
        dataIndex: 'testedby',
        hidden: true
    }, {
        header: "Closed",
        width: 90,
        sortable: true,
        dataIndex: 'close_date'
    }, {
        header: "Status",
        width: 30,
        sortable: true,
        dataIndex: 'status',
        align: 'center',
        renderer: Testopia.Util.displayStatusIcon
    }, {
        header: "Priority",
        width: 60,
        sortable: true,
        dataIndex: 'priority',
        editor: new Ext.grid.GridEditor(new Testopia.TestCase.PriorityCombo({
            id: 'caserun_priority'
        })),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Category",
        width: 100,
        sortable: true,
        dataIndex: 'category',
        editor: new Ext.grid.GridEditor(new Testopia.Category.Combo({
            id: 'caserun_category',
            params: {
                product_id: run.plan.product_id
            }
        })),
        renderer: Testopia.Util.ComboRenderer.createDelegate(this)
    }, {
        header: "Requirement",
        width: 150,
        sortable: true,
        dataIndex: 'requirement',
        hidden: true
    }, {
        header: "Component",
        width: 100,
        sortable: true,
        dataIndex: 'component'
    }, {
        header: "Plan Name",
        width: 100,
        sortable: true,
        hidden: true,
        dataIndex: 'plan_name'
    }, {
        header: "Bugs In This Build and Environment",
        width: 100,
        dataIndex: "bug_list",
        sortable: false,
        hideable: true,
        renderer: function(v){
            var bugs = v.bugs;
            var rets = '';
            for (var i = 0; i < bugs.length; i++) {
                if (typeof bugs[i] != 'function') {
                    rets = rets + '<a href="show_bug.cgi?id=' + bugs[i].bug_id + '" ' + (bugs[i].closed ? 'class="bz_closed"' : '') + '>' + bugs[i].bug_id + '</a>, ';
                }
                
            }
            return rets;
        }
    }, {
        header: "Bugs In All Builds and Environments",
        width: 100,
        dataIndex: "case_bug_list",
        sortable: false,
        hideable: true,
        renderer: function(v){
            var bugs = v.bugs;
            var rets = '';
            for (var i = 0; i < bugs.length; i++) {
                if (typeof bugs[i] != 'function') {
                    rets = rets + '<a href="show_bug.cgi?id=' + bugs[i].bug_id + '" ' + (bugs[i].closed ? 'class="bz_closed"' : '') + '>' + bugs[i].bug_id + '</a>, ';
                }
                
            }
            return rets;
        }
    }];
    
    this.form = new Ext.form.BasicForm('testopia_helper_frm', {});
    this.bbar = new Testopia.Util.PagingBar('caserun', this.store);
    this.tbar = new Ext.Toolbar({
        id: 'caserun_grid_tb',
        items: [{
            xtype: 'button',
            template: imgButtonTpl,
            text: 'extensions/testopia/img/IDLE.gif',
            tooltip: 'Mark as IDLE (Not Run)',
            disabled: true,
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 1,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                }, Ext.getCmp('caserun_grid'));
            }
        }, {
            xtype: 'button',
            template: imgButtonTpl,
            text: 'extensions/testopia/img/PASSED.gif',
            tooltip: 'Mark as PASSED',
            disabled: true,
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 2,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id'),
                    update_bug: Ext.getCmp('update_bugs').getValue()
                }, Ext.getCmp('caserun_grid'));
            }
        }, {
            xtype: 'button',
            template: imgButtonTpl,
            text: 'extensions/testopia/img/FAILED.gif',
            tooltip: 'Mark as FAILED',
            disabled: true,
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 3,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id'),
                    update_bug: Ext.getCmp('update_bugs').getValue()
                }, Ext.getCmp('caserun_grid'));
            }
        }, {
            xtype: 'button',
            template: imgButtonTpl,
            text: 'extensions/testopia/img/RUNNING.gif',
            tooltip: 'Mark as RUNNING',
            disabled: true,
            handler: function(){
                var reassign = 0;
                var isowner = 1;
                var sel = Ext.getCmp('caserun_grid').getSelectionModel().getSelections();
                for (var i = 0; i < sel.length; i++) {
                    if (sel[i].get('assignee') != user_login) {
                        isowner = 0;
                        break;
                    }
                }
                if (isowner == 0) {
                    Ext.Msg.show({
                        title: "Reassign Test Case?",
                        msg: 'Setting this test case to Running will lock it so that only the assignee can update it. Would you like to make yourself the assignee?',
                        buttons: Ext.MessageBox.YESNO,
                        icon: Ext.MessageBox.QUESTION,
                        fn: function(btn){
                            if (btn == 'yes') {
                                reassign = 1;
                            }
                            Testopia.Util.updateFromList('caserun', {
                                status_id: 4,
                                reassign: reassign,
                                ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                            }, Ext.getCmp('caserun_grid'));
                        }
                    });
                }
                else {
                    Testopia.Util.updateFromList('caserun', {
                        status_id: 4,
                        reassign: reassign,
                        ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                    }, Ext.getCmp('caserun_grid'));
                }
            }
        }, {
            xtype: 'button',
            template: imgButtonTpl,
            text: 'extensions/testopia/img/PAUSED.gif',
            tooltip: 'Mark as PAUSED',
            disabled: true,
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 5,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                }, Ext.getCmp('caserun_grid'));
            }
        }, {
            xtype: 'button',
            template: imgButtonTpl,
            text: 'extensions/testopia/img/BLOCKED.gif',
            tooltip: 'Mark as BLOCKED',
            disabled: true,
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 6,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                }, Ext.getCmp('caserun_grid'));
            }
        }, {
            xtype: 'button',
            template: imgButtonTpl,
            text: 'extensions/testopia/img/ERROR.gif',
            tooltip: 'Mark as ERROR',
            disabled: true,
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 7,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                }, Ext.getCmp('caserun_grid'));
            }
        }, ' ', '-', 'Update Bugs: ', new Ext.form.Checkbox({
            id: 'update_bugs',
            disabled: true
        }), ' ', '-', ' ', buildCombo, ' ', envCombo, new Ext.Toolbar.Fill(), 
        {
            xtype: 'button',
            id: 'caserun_grid_tocsv',
            icon: 'extensions/testopia/img/csv.png',
            iconCls: 'img_button_16x',
            tooltip: 'Export Results to CSV',
            handler: function(){
                window.location = 'tr_list_caseruns.cgi?ctype=csv&viewall=1&run_id=' + run.run_id;
            }
        }, {
            xtype: 'button',
            id: 'add_case_to_run_btn',
            tooltip: "Add cases to this run",
            icon: 'extensions/testopia/img/add.png',
            iconCls: 'img_button_16x',
            handler: function(){
                Testopia.TestRun.AddCasePopup(run);
            }
        }, {
            xtype: 'button',
            id: 'new_case_to_run_btn',
            tooltip: "Create a new case and add it to this run",
            icon: 'extensions/testopia/img/new.png',
            iconCls: 'img_button_16x',
            handler: function(){
                Testopia.TestCase.NewCasePopup(run.plan_id, run.product_id, run.run_id);
            }
        }, {
            xtype: 'button',
            id: 'caserun_grid_edit_btn',
            icon: 'extensions/testopia/img/edit.png',
            iconCls: 'img_button_16x',
            tooltip: 'Edit Selected Test Case',
            handler: function(){
                Testopia.Util.editFirstSelection(Ext.getCmp('caserun_grid'));
            }
        }, {
            xtype: 'button',
            id: 'caserun_grid_delete_btn',
            icon: 'extensions/testopia/img/delete.png',
            iconCls: 'img_button_16x',
            tooltip: 'Remove Selected Test Cases from This Run',
            handler: this.deleteList.createDelegate(this)
        }, new Testopia.TestRun.ProgressBar({
            id: 'run_progress',
            text: '0%',
            width: 100
        })]
    });
    Testopia.TestCaseRun.Grid.superclass.constructor.call(this, {
        region: 'center',
        id: 'caserun_grid',
        border: false,
        bodyBorder: false,
        height: '400',
        stripeRows: true,
        split: true,
        enableDragDrop: true,
        loadMask: {
            msg: 'Loading Test Cases...'
        },
        autoExpandColumn: "case_summary",
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false,
            listeners: {
                'rowdeselect': function(sm, n, r){
                    if (sm.getCount() < 1) {
                        Ext.getCmp('case_details_panel').disable();
                        Ext.getCmp('tb_build').disable();
                        Ext.getCmp('tb_environment').disable();
                        Ext.getCmp('update_bugs').disable();
                        
                        var items = this.grid.getTopToolbar().items.items;
                        for (var i = 0; i < items.length; i++) {
                            if ((items[i].id == 'add_case_to_run_btn' || items[i].id == 'run_progress')) {
                                if (Ext.getCmp('run_status_cycle').text == 'RUNNING') {
                                    items[i].enable();
                                }
                            }
                            else {
                                items[i].disable();
                            }
                        }
                    }
                },
                'rowselect': function(sm, n, r){
                    Ext.getCmp('case_details_panel').enable();
                    if (Ext.getCmp('run_status_cycle').text == 'RUNNING') {
                        Ext.getCmp('summary_tb').enable();
                        Ext.getCmp('tb_build').enable();
                        Ext.getCmp('tb_environment').enable();
                        Ext.getCmp('update_bugs').enable();
                        var items = sm.grid.getTopToolbar().items.items;
                        for (var i = 0; i < items.length; i++) {
                            items[i].enable();
                        }
                    }
                    if (n == selected) {
                        return;
                    }
                    var sel = [];
                    for (i = 0; i < sm.grid.store.data.items.length; i++) {
                        if (sm.grid.getSelectionModel().isSelected(i)) {
                            sel.push(sm.grid.store.getAt(i).get('case_id'));
                        }
                    }
                    sm.grid.selectedRows = sel;
                    if (sm.getCount() > 1) {
                        return;
                    }
                    
                    Ext.getCmp('case_bugs_panel').tcid = r.get('case_id');
                    Ext.getCmp('case_comps_panel').tcid = r.get('case_id');
                    Ext.getCmp('attachments_panel').object = r.data;
                    Ext.getCmp('case_details_panel').caserun_id = r.get('caserun_id');
                    Ext.getCmp('casetagsgrid').obj_id = r.get('case_id');
                    
                    var tab = Ext.getCmp('caserun_center_region').getActiveTab();
                    Ext.getCmp(tab.id).fireEvent('activate');
                    if (Ext.getCmp('case_bugs_panel')) {
                        Ext.getCmp('case_bugs_panel').case_id = r.get('case_id');
                    }
                    if (Ext.getCmp('case_bugs_panel')) {
                        Ext.getCmp('case_bugs_panel').case_id = r.get('case_id');
                    }
                    Ext.getCmp('case_details_panel').store.load({
                        params: {
                            caserun_id: r.get('caserun_id'),
                            action: 'gettext'
                        }
                    });
                    selected = n;
                }
            }
        }),
        viewConfig: {
            forceFit: true,
            enableRowBody: true,
            getRowClass: function(record, rowIndex, p, ds){
                p.body = '<p><a href="javascript:Ext.getCmp(\'caserun_grid\').summary_sort()">Summary:</a> ' + record.data.case_summary + '</p>';
                return 'x-grid3-row-expanded';
            }
        }
    });
    
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('afteredit', this.onGridEdit, this);
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.TestCaseRun.Grid, Ext.grid.EditorGridPanel, {
    onContextClick: function(grid, index, e){
        grid.selindex = index;
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'caserun-ctx-menu',
                items: [{
                    text: 'Change',
                    icon: 'extensions/testopia/img/edit.png',
                    iconCls: 'img_button_16x',
                    menu: {
                        items: [{
                            text: 'Build',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Edit Build',
                                    id: 'status-win',
                                    plain: true,
                                    shadow: false,
                                    width: 320,
                                    height: 150,
                                    listeners: {'afterlayout':function(){Ext.getCmp('multi_build').focus('',10)}},
                                    layout: 'form',
                                    bodyStyle: 'padding: 5px',
                                    items: [new Testopia.Build.Combo({
                                        params: {
                                            product_id: grid.run.plan.product_id,
                                            activeonly: 1
                                        },
                                        fieldLabel: 'Build',
                                        id: 'multi_build'
                                    }), new Ext.form.Checkbox({
                                        fieldLabel: 'Apply to all cases in this run',
                                        id: 'build_applyall'
                                    })],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            params = {
                                                run_id: grid.run.run_id,
                                                applyall: Ext.getCmp('build_applyall').getValue(),
                                                build_id: Ext.getCmp('multi_build').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'caserun_id')
                                            };
                                            Testopia.Util.updateFromList('caserun', params, grid);
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
                            text: 'Environment',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Edit Environment',
                                    id: 'status-win',
                                    plain: true,
                                    shadow: false,
                                    width: 320,
                                    height: 150,
                                    listeners: {'afterlayout':function(){Ext.getCmp('multi_env').focus('',10)}},
                                    layout: 'form',
                                    bodyStyle: 'padding: 5px',
                                    items: [new Testopia.Environment.Combo({
                                        params: {
                                            product_id: grid.run.plan.product_id,
                                            isactive: 1
                                        },
                                        fieldLabel: 'Environment',
                                        id: 'multi_env'
                                    }), new Ext.form.Checkbox({
                                        fieldLabel: 'Apply to all cases in this run',
                                        id: 'env_applyall'
                                    })],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            params = {
                                                run_id: grid.run.run_id,
                                                applyall: Ext.getCmp('env_applyall').getValue(),
                                                env_id: Ext.getCmp('multi_env').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'caserun_id')
                                            };
                                            Testopia.Util.updateFromList('caserun', params, grid);
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
                                    plain: true,
                                    shadow: false,
                                    width: 320,
                                    height: 150,
                                    listeners: {'afterlayout':function(){Ext.getCmp('multi_priority').focus('',10)}},
                                    layout: 'form',
                                    bodyStyle: 'padding: 5px',
                                    items: [new Testopia.TestCase.PriorityCombo({
                                        fieldLabel: 'Priority',
                                        id: 'multi_priority'
                                    })],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            params = {
                                                run_id: grid.run.run_id,
                                                priority: Ext.getCmp('multi_priority').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'caserun_id')
                                            };
                                            Testopia.Util.updateFromList('caserun', params, grid);
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
                            text: 'Category',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Edit Category',
                                    id: 'status-win',
                                    plain: true,
                                    shadow: false,
                                    width: 300,
                                    height: 150,
                                    listeners: {'afterlayout':function(){Ext.getCmp('multi_category').focus('',10)}},
                                    items: [new Testopia.Category.Combo({
                                        fieldLabel: 'Category',
                                        id: 'multi_category',
                                        params: {
                                            product_id: run.product_id
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
                            text: 'Assignee',
                            handler: function(){
                                var win = new Ext.Window({
                                    title: 'Edit Assignee',
                                    id: 'status-win',
                                    plain: true,
                                    shadow: false,
                                    width: 320,
                                    height: 150,
                                    listeners: {'afterlayout':function(){Ext.getCmp('multi_assignee').focus('',10)}},
                                    layout: 'form',
                                    bodyStyle: 'padding: 5px',
                                    items: [new Testopia.User.Lookup({
                                        fieldLabel: 'Assignee',
                                        id: 'multi_assignee'
                                    }), new Ext.form.Checkbox({
                                        fieldLabel: 'Apply to all cases in this run',
                                        id: 'assignee_applyall'
                                    })],
                                    buttons: [{
                                        text: 'Submit',
                                        handler: function(){
                                            params = {
                                                run_id: grid.run.run_id,
                                                applyall: Ext.getCmp('assignee_applyall').getValue(),
                                                assignee: Ext.getCmp('multi_assignee').getValue(),
                                                ids: Testopia.Util.getSelectedObjects(grid, 'caserun_id')
                                            };
                                            Testopia.Util.updateFromList('caserun', params, grid);
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
                    text: 'Remove Selected Cases',
                    icon: 'extensions/testopia/img/delete.png',
                    iconCls: 'img_button_16x',
                    handler: this.deleteList.createDelegate(this)
                }, {
                    text: 'Add or Remove Tags',
                    handler: function(){
                        Testopia.Tags.update('case', grid);
                    }
                }, {
                    text: 'New Test Run',
                    id: 'addRun',
                    handler: function(){
                        window.location = "tr_new_run.cgi?plan_id=" + run.plan_id;
                    }
                }, {
                    text: 'Clone Run with Selected Cases',
                    handler: function(){
                        Testopia.TestRun.ClonePopup(grid.run.product_id, grid.run.run_id, Testopia.Util.getSelectedObjects(grid, 'case_id'));
                    }
                }, {
                    text: 'Copy or Link Selected Test Cases to Plan(s)... ',
                    handler: function(){
                        var r = grid.getSelectionModel().getSelected();
                        Testopia.TestCase.clonePopup(grid.run.product_id, Testopia.Util.getSelectedObjects(grid, 'case_id'));
                    }
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
                    text: 'Refresh List',
                    icon: 'extensions/testopia/img/refresh.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        grid.store.reload();
                    }
                }, {
                    text: 'View Test Case in a New Window',
                    handler: function(){
                        window.open('tr_show_case.cgi?case_id=' + grid.store.getAt(grid.selindex).get('case_id'));
                    }
                }, {
                    text: 'List These Test Cases in a New Window',
                    handler: function(){
                        var params = Ext.getCmp('caserun_search').form.getValues();
                        if (params) {
                            window.open('tr_list_cases.cgi?' + Testopia.Util.JSONToURLQuery(params, '', ['current_tab']) + '&isactive=1');
                        }
                        else {
                            window.open('tr_list_cases.cgi?run_id=' + grid.store.getAt(grid.selindex).get('run_id'));
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
    onGridEdit: function(gevent){
        var myparams = {
            caserun_id: gevent.record.get('caserun_id')
        };
        var ds = this.store;
        
        switch (gevent.field) {
            case 'sortkey':
                myparams.action = 'update_sortkey';
                myparams.sortkey = gevent.value;
                break;
            case 'build':
                myparams.action = 'update_build';
                myparams.build_id = gevent.value;
                break;
            case 'environment':
                myparams.action = 'update_environment';
                myparams.caserun_env = gevent.value;
                break;
            case 'assignee':
                myparams.action = 'update_assignee';
                myparams.assignee = gevent.value;
                break;
            case 'priority':
                myparams.action = 'update_priority';
                myparams.priority = gevent.value;
                break;
            case 'category':
                myparams.action = 'update_category';
                myparams.category = gevent.value;
                break;
        }
        this.form.submit({
            url: "tr_caserun.cgi",
            params: myparams,
            success: function(f, a){
                if (a.result.caserun) {
                    var switched = gevent.grid.store.reader.readRecords({
                        Result: [a.result.caserun]
                    }).records[0];
                    gevent.grid.store.insert(gevent.row, switched);
                    ds.commitChanges();
                    gevent.grid.store.remove(gevent.record);
                    gevent.grid.getSelectionModel().selectRow(gevent.row);
                }
                else {
                    ds.commitChanges();
                }
            },
            failure: function(f, a){
                Testopia.Util.error(f, a);
                ds.rejectChanges();
            }
        });
    },
    deleteList: function(){
        var grid = this;
        if (grid.getSelectionModel().getCount() < 1) {
            return;
        }
        var win = new Ext.Window({
            title: 'Confirm Delete?',
            id: 'case_delete_win',
            plain: true,
            shadow: false,
            width: 520,
            height: 250,
            layout: 'table',
            bodyStyle: 'padding: 5px',
            layoutConfig: {
                columns: 1,
                width: '100%'
            },
            items: [{
                html: CASERUN_DELETE_WARNING,
                bodyStyle: 'padding: 5px; font-weight:bold; color: red'
            }, {
                xtype: 'fieldset',
                items:[{
                    xtype: 'radio',
                    name: 'delete_cases_options',
                    id: 'delete_cases_radio_group',
                    inputValue: 'cr_all',
                    checked: true,
                    boxLabel: 'Remove case from this run for all builds and environments',
                    hideLabel: true
                }, {
                    xtype: 'radio',
                    name: 'delete_cases_options',
                    inputValue: 'cr',
                    boxLabel: 'Remove case from this run for SELECTED build and environment only',
                    hideLabel: true
                }, {
                    xtype: 'radio',
                    name: 'delete_cases_options',
                    inputValue: 'plan_single',
                    boxLabel: 'Remove case from this run and from this test plan',
                    hideLabel: true
                }, {
                    xtype: 'radio',
                    name: 'delete_cases_options',
                    inputValue: 'all_plans',
                    boxLabel: 'Delete this case completely (remove from all test plans)',
                    hideLabel: true
                }]
            }],
            buttons: [{
                text: 'Submit',
                handler: function(){
                    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm');
                    testopia_form.submit({
                        url: 'tr_list_caseruns.cgi',
                        params: {
                            caserun_ids: Testopia.Util.getSelectedObjects(grid, 'caserun_id'),
                            action: 'delete',
                            deltype: Ext.getCmp('delete_cases_radio_group').getGroupValue(),
                            ctype: 'json'
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
                    win.close();
                }
            }, {
                text: 'Cancel',
                handler: function(){
                    win.close();
                }
            }]
        });
        win.show(this);
    },
    onActivate: function(event){
        if (!this.store.getCount()) {
            this.store.load();
        }
    }
});

Testopia.TestCaseRun.Info = function(){
    this.caserun_id;
    this.store = new Ext.data.Store({
        url: 'tr_caserun.cgi',
        baseParams: {
            action: 'gettext'
        },
        reader: new Ext.data.XmlReader({
            record: 'casetext',
            id: 'case_id'
        }, [{
            name: 'action',
            mapping: 'action'
        }, {
            name: 'results',
            mapping: 'effect'
        }, {
            name: 'setup',
            mapping: 'setup'
        }, {
            name: 'breakdown',
            mapping: 'breakdown'
        }, {
            name: 'case_id',
            mapping: 'case_id'
        }, {
            name: 'summary',
            mapping: 'summary'
        }, {
            name: 'notes',
            mapping: 'notes'
        }])
    });
    var store = this.store;
    store.on('load', function(s, r){
        Ext.getCmp('action_editor').setValue(r[0].get('action'));
        Ext.getCmp('effect_editor').setValue(r[0].get('results'));
        Ext.getCmp('setup_editor').setValue(r[0].get('setup'));
        Ext.getCmp('breakdown_editor').setValue(r[0].get('breakdown'));
        Ext.getCmp('caserun_tb_summary').setText('Case ' + r[0].get('case_id') + ' - ' + r[0].get('summary'));
    });
    
    appendNote = function(){
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        form.submit({
            url: 'tr_list_caseruns.cgi',
            params: {
                action: 'update',
                note: Ext.getCmp('caserun_append_note_fld').getValue(),
                ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
            },
            success: function(){
                Ext.getCmp('caserun_append_note_fld').reset();
                store.reload();
            },
            failure: Testopia.Util.error
        });
    };
    processText = function(){
        var testopia_form = new Ext.form.BasicForm('testopia_helper_frm', {});
        var params = {};
        params.tcsetup = Ext.getCmp('setup_editor').getValue();
        params.tcbreakdown = Ext.getCmp('breakdown_editor').getValue();
        params.tcaction = Ext.getCmp('action_editor').getValue();
        params.tceffect = Ext.getCmp('effect_editor').getValue();
        params.case_id = Ext.getCmp('caserun_grid').getSelectionModel().getSelected().get('case_id');
        params.action = 'update_doc';
        testopia_form.submit({
            url: 'tr_process_case.cgi',
            params: params,
            success: function(){
                Testopia.Util.notify.msg('Test case updated', 'Test Case {0} was updated successfully', 'Document');
            },
            failure: Testopia.Util.error
        });
    }
    var summary_tb = new Ext.Toolbar({
        id: 'summary_tb',
        disabled: true,
        items: [new Ext.Button({
            template: imgButtonTpl,
            text: 'extensions/testopia/img/IDLE.gif',
            tooltip: 'Mark as IDLE (Not Run)',
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 1,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                }, Ext.getCmp('caserun_grid'));
            }
        }), new Ext.Button({
            template: imgButtonTpl,
            text: 'extensions/testopia/img/PASSED.gif',
            tooltip: 'Mark as PASSED',
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 2,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id'),
                    update_bug: Ext.getCmp('update_bugs').getValue()
                }, Ext.getCmp('caserun_grid'));
            }
        }), new Ext.Button({
            template: imgButtonTpl,
            text: 'extensions/testopia/img/FAILED.gif',
            tooltip: 'Mark as FAILED',
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 3,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id'),
                    update_bug: Ext.getCmp('update_bugs').getValue()
                }, Ext.getCmp('caserun_grid'));
            }
        }), new Ext.Button({
            template: imgButtonTpl,
            text: 'extensions/testopia/img/RUNNING.gif',
            tooltip: 'Mark as RUNNING',
            handler: function(){
                var reassign = 0;
                var isowner = 1;
                var sel = Ext.getCmp('caserun_grid').getSelectionModel().getSelections();
                for (var i = 0; i < sel.length; i++) {
                    if (sel[i].get('assignee') != user_login) {
                        isowner = 0;
                        break;
                    }
                }
                if (isowner == 0) {
                    Ext.Msg.show({
                        title: "Reassign Test Case?",
                        msg: 'Setting this test case to Running will lock it so that only the assignee can update it. Would you like to make yourself the assignee?',
                        buttons: Ext.MessageBox.YESNO,
                        icon: Ext.MessageBox.QUESTION,
                        fn: function(btn){
                            if (btn == 'yes') {
                                reassign = 1;
                            }
                            Testopia.Util.updateFromList('caserun', {
                                status_id: 4,
                                reassign: reassign,
                                ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                            }, Ext.getCmp('caserun_grid'));
                        }
                    });
                }
                else {
                    Testopia.Util.updateFromList('caserun', {
                        status_id: 4,
                        reassign: reassign,
                        ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                    }, Ext.getCmp('caserun_grid'));
                }
            }
        }), new Ext.Button({
            template: imgButtonTpl,
            text: 'extensions/testopia/img/PAUSED.gif',
            tooltip: 'Mark as PAUSED',
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 5,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                }, Ext.getCmp('caserun_grid'));
            }
        }), new Ext.Button({
            template: imgButtonTpl,
            text: 'extensions/testopia/img/BLOCKED.gif',
            tooltip: 'Mark as BLOCKED',
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 6,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                }, Ext.getCmp('caserun_grid'));
            }
        }), new Ext.Button({
            template: imgButtonTpl,
            text: 'extensions/testopia/img/ERROR.gif',
            tooltip: 'Mark as ERROR',
            handler: function(){
                Testopia.Util.updateFromList('caserun', {
                    status_id: 7,
                    ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                }, Ext.getCmp('caserun_grid'));
            }
        }), new Ext.Toolbar.TextItem({text:'', id:'caserun_tb_summary'})]
    });
    Testopia.TestCaseRun.Info.superclass.constructor.call(this, {
        id: 'case_details_panel',
        layout: 'fit',
        region: 'south',
        split: true,
        border: false,
        style: 'padding-bottom: 10px',
        bodyBorder: false,
        collapsible: true,
        height: 340,
        items: [{
            xtype: 'tabpanel',
            bodyBorder: false,
            activeTab: 0,
            id: 'caserun_center_region',
            title: 'Details',
            tbar: summary_tb,
            items: [{
                layout: 'column',
                title: 'Action / Expected Results',
                id: 'action_panel',
                items: [{
                    columnWidth: 0.5,
                    layout: 'fit',
                    items: {
                        title: 'Action',
                        height: Ext.state.Manager.get('bigtext_height', 230),
                        id: 'cr_action_panel',
                        bodyBorder: false,
                        border: false,
                        layout: 'fit',
                        autoScroll: true,
                        items: [{
                            id: 'action_editor',
                            xtype: 'htmleditor'
                        }]
                    }
                }, {
                    columnWidth: 0.5,
                    layout: 'fit',
                    items: {
                        title: 'Expected Results',
                        height: Ext.state.Manager.get('bigtext_height', 230),
                        id: 'cr_results_panel',
                        bodyBorder: false,
                        border: false,
                        autoScroll: true,
                        layout: 'fit',
                        items: [{
                            id: 'effect_editor',
                            xtype: 'htmleditor'
                        }]
                    }
                }],
                buttons: [{
                    text: 'Update Action/Results',
                    handler: processText.createDelegate(this)
                }]
            }, {
                layout: 'column',
                title: 'Set Up / Break Down',
                items: [{
                    columnWidth: 0.5,
                    layout: 'fit',
                    items: {
                        title: 'Setup',
                        height: Ext.state.Manager.get('bigtext_height', 230),
                        id: 'cr_setup_panel',
                        bodyBorder: false,
                        autoScroll: true,
                        border: false,
                        layout: 'fit',
                        items: [{
                            id: 'setup_editor',
                            xtype: 'htmleditor'
                        }]
                    }
                }, {
                    columnWidth: 0.5,
                    layout: 'fit',
                    items: {
                        title: 'Breakdown',
                        height: Ext.state.Manager.get('bigtext_height', 230),
                        id: 'cr_breakdown_panel',
                        bodyBorder: false,
                        autoScroll: true,
                        border: false,
                        layout: 'fit',
                        items: [{
                            id: 'breakdown_editor',
                            xtype: 'htmleditor'
                        }]
                    }
                }],
                buttons: [{
                    text: 'Update Setup/Breakdown',
                    handler: processText.createDelegate(this)
                }]
            }, {
                title: 'Notes',
                id: 'caserun_notes_panel',
                border: false,
                bodyBorder: false,
                autoScroll: true,
                layout: 'fit',
                items: [{
                    xtype: 'dataview',
                    bodyBorder: false,
                    store: store,
                    itemSelector: 'div.breakdowndiv',
                    loadingText: 'Loading...',
                    tpl: new Ext.XTemplate('<tpl for=".">', '<div id="notesdiv" style="margin: 5px; padding: 5px; border: 1px solid black;"><pre>{notes}</pre></div>', '</tpl>', '<div class="x-clear"><input id="caserun_append_note_fld" ></div>')
                }],
                bbar: ['Add a Note: ', {
                    xtype: 'textfield',
                    id: 'caserun_append_note_fld',
                    listeners: {'afterrender': function(){
                        this.setWidth(Ext.getCmp('caserun_notes_panel').container.getWidth() - 150)
                    }},
                    width: 650
                }, {
                    xtype: 'button',
                    text: 'Append Note',
                    handler: appendNote.createDelegate(this)
                }]
            }, new Testopia.TestCaseRun.History(), new Testopia.Attachment.Grid({
                id: 0,
                type: 'caserun'
            }), new Testopia.TestCase.Bugs.Grid(), new Testopia.TestCase.Components(), new Testopia.Tags.ObjectTags('case', 0)]
        }]
    });
};
Ext.extend(Testopia.TestCaseRun.Info, Ext.Panel, this);

Testopia.TestCaseRun.History = function(){
    this.store = new Ext.data.JsonStore({
        url: 'tr_caserun.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'gethistory'
        },
        root: 'records',
        fields: [{
            name: 'caserun_id',
            mapping: 'case_run_id'
        }, {
            name: 'build',
            mapping: 'build_name'
        }, {
            name: 'environment',
            mapping: 'env_name'
        }, {
            name: 'status',
            mapping: 'status_name'
        }, {
            name: 'testedby',
            mapping: 'testedby'
        }, {
            name: 'closed',
            mapping: 'close_date'
        }, {
            name: 'isactive',
            mapping: 'isactive'
        }, {
            name: "bug_list",
            mapping: "bug_list"
        }]
    });
    this.columns = [{
        header: "Build",
        width: 150,
        dataIndex: 'build',
        sortable: true
    }, {
        header: "Environment",
        width: 150,
        dataIndex: 'environment',
        sortable: true
    }, {
        header: "Status",
        width: 50,
        dataIndex: 'status',
        sortable: true,
        renderer: Testopia.Util.displayStatusIcon
    }, {
        header: "Tested By",
        width: 200,
        dataIndex: 'testedby',
        sortable: true
    }, {
        header: "Closed",
        width: 150,
        dataIndex: 'closed',
        sortable: true
    }, {
        header: "Bugs In This Build and Environment",
        width: 100,
        dataIndex: "bug_list",
        sortable: false,
        hideable: true,
        renderer: function(v){
            if (!v) {
                return;
            }
            var bugs = v.bugs;
            var rets = '';
            for (var i = 0; i < bugs.length; i++) {
                if (typeof bugs[i] != 'function') {
                    rets = rets + '<a href="show_bug.cgi?id=' + bugs[i].bug_id + '" ' + (bugs[i].closed ? 'class="bz_closed"' : '') + '>' + bugs[i].bug_id + '</a>, ';
                }
                
            }
            return rets;
        }
    }];
    Testopia.TestCaseRun.History.superclass.constructor.call(this, {
        border: false,
        title: 'History',
        id: 'caserun_history_panel',
        bodyBorder: false,
        loadMask: {
            msg: 'Loading Test Cases...'
        },
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: true
        })
    });
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.TestCaseRun.History, Ext.grid.GridPanel, {
    onActivate: function(event){
        this.store.load({
            params: {
                action: 'gethistory',
                caserun_id: Ext.getCmp('caserun_grid').getSelectionModel().getSelected().get('caserun_id')
            }
        
        });
    }
});

Testopia.TestCase.Bugs.Grid = function(id){
    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm', {});
    function bug_link(id){
        return '<a href="show_bug.cgi?id=' + id + '" target="_blank">' + id + '</a>';
    }
    
    var tcid;
    if (id) {
        tcid = id;
    }
    
    this.tcid = tcid;
    this.store = new Ext.data.JsonStore({
        url: 'tr_process_case.cgi',
        root: 'bugs',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getbugs'
        },
        fields: [{
            name: 'run_id',
            mapping: 'run_id'
        }, {
            name: 'build',
            mapping: 'build'
        }, {
            name: 'env',
            mapping: 'env'
        }, {
            name: 'summary',
            mapping: 'summary'
        }, {
            name: 'case_run_id',
            mapping: 'case_run_id'
        }, {
            name: 'bug_id',
            mapping: 'bug_id'
        }, {
            name: 'status',
            mapping: 'status'
        }, {
            name: 'resolution',
            mapping: 'resolution'
        }, {
            name: 'assignee',
            mapping: 'assignee'
        }, {
            name: 'severity',
            mapping: 'severity'
        }, {
            name: 'priority',
            mapping: 'priority'
        }]
    });
    addbug = function(){
        tcid = this.tcid;
        var ids;
        var type = 'case';
        if (Ext.getCmp('caserun_grid')) {
            type = 'caserun';
            ids = Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id');
        }
        else {
            ids = tcid;
        }
        testopia_form.submit({
            url: 'tr_list_cases.cgi',
            params: {
                action: 'update_bugs',
                bug_action: 'attach',
                bugs: Ext.getCmp('attachbug').getValue(),
                type: type,
                ids: ids
            },
            success: function(){
                ds.load({
                    params: {
                        case_id: tcid
                    }
                });
                Ext.getCmp('attachbug').reset();
            },
            failure: Testopia.Util.error
        });
    };
    removebug = function(){
        tcid = this.tcid;
        var type = 'case';
        if (Ext.getCmp('caserun_grid')) {
            type = 'caserun';
            ids = Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id');
        }
        else {
            ids = tcid;
        }
        testopia_form.submit({
            url: 'tr_list_cases.cgi',
            params: {
                action: 'update_bugs',
                bugs: Testopia.Util.getSelectedObjects(Ext.getCmp('case_bugs_panel'), 'bug_id'),
                type: type,
                ids: ids
            },
            success: function(){
                ds.load({
                    params: {
                        case_id: tcid
                    }
                });
            },
            failure: Testopia.Util.error
        });
    };
    newbug = function(){
        var bug_panel = new Ext.Panel({
            id: 'new_bug_panel'
        });
        var caserun_id;
        if (Ext.getCmp('caserun_grid') && Ext.getCmp('caserun_grid').getSelectionModel().getCount()) {
            caserun_id = Ext.getCmp('caserun_grid').getSelectionModel().getSelected().get('caserun_id');
        }
        
        var store = new Ext.data.Store({
            url: 'tr_process_case.cgi',
            baseParams: {
                action: 'case_to_bug',
                case_id: this.tcid,
                caserun_id: caserun_id
            },
            reader: new Ext.data.XmlReader({
                record: 'newbug',
                id: 'case_id'
            }, [{
                name: 'product',
                mapping: 'product'
            }, {
                name: 'version',
                mapping: 'version'
            }, {
                name: 'component',
                mapping: 'component'
            }, {
                name: 'comment',
                mapping: 'comment'
            }, {
                name: 'case_id',
                mapping: 'case_id'
            }, {
                name: 'assigned_to',
                mapping: 'assigned_to'
            }, {
                name: 'qa_contact',
                mapping: 'qa_contact'
            }, {
                name: 'short_desc',
                mapping: 'short_desc'
            }])
        });
        store.load();
        store.on('load', function(){
//            var url = 'enter_bug.cgi?';
            var f = document.createElement("form");
            f.setAttribute("method", "post");
            f.setAttribute("action", "enter_bug.cgi");
            f.setAttribute("target", "_blank");

            for (var i = 0; i < store.fields.keys.length; i++) {
//                url = url + store.fields.keys[i] + '=' + escape(store.getAt(0).get(store.fields.keys[i])) + '&';
                if (store.fields.keys[i] == 'comment'){
                    h = document.createElement("textarea");
                    h.setAttribute("name", store.fields.keys[i]);
                    h.value = store.getAt(0).get(store.fields.keys[i]);
                }
                else {
                    h = document.createElement("input");
                    h.setAttribute("name", store.fields.keys[i]);
                    txt = store.getAt(0).get(store.fields.keys[i]).replace(/\n/,'&#10');
                    h.setAttribute("value", store.getAt(0).get(store.fields.keys[i]));
                }
                f.appendChild(h);
            }
            h = document.createElement("input");
            h.setAttribute("name", "caserun_id");
            h.setAttribute("value", caserun_id);
            f.appendChild(h);
            document.body.appendChild(f);
            f.submit();
//            url = url + 'caserun_id=' + caserun_id;
//            window.open(url);
        });
    };
    var ds = this.store;
    this.columns = [{
        header: "Bug",
        width: 150,
        dataIndex: 'bug_id',
        sortable: true,
        renderer: bug_link
    }, {
        header: "Found In Run",
        width: 50,
        dataIndex: 'run_id',
        sortable: true,
        renderer: Testopia.Util.makeLink.createDelegate(this,['run'],true)
    }, {
        header: "With Build",
        width: 50,
        dataIndex: 'build',
        sortable: true
    }, {
        header: "Environment",
        width: 50,
        dataIndex: 'env',
        sortable: true
    }, {
        id: 'bugs_summary',
        header: "Summary",
        width: 200,
        dataIndex: 'summary',
        sortable: true
    }, {
        header: "Status",
        width: 50,
        dataIndex: 'status',
        sortable: true
    }, {
        header: "Resolution",
        width: 50,
        dataIndex: 'resolution',
        sortable: true
    }, {
        header: "Severity",
        width: 50,
        dataIndex: 'severity',
        sortable: true
    }, {
        header: "Asignee",
        width: 150,
        dataIndex: 'assignee',
        sortable: true
    }, {
        header: "Priority",
        width: 50,
        dataIndex: 'priority',
        sortable: true
    }];
    Testopia.TestCase.Bugs.Grid.superclass.constructor.call(this, {
        tbar: [new Ext.form.TextField({
            width: 50,
            id: 'attachbug'
        }), {
            xtype: 'button',
            tooltip: "Attach a Bug",
            icon: 'extensions/testopia/img/add.png',
            iconCls: 'img_button_16x',
            handler: addbug.createDelegate(this)
        }, {
            xtype: 'button',
            tooltip: "File new Bug",
            icon: 'extensions/testopia/img/new.png',
            iconCls: 'img_button_16x',
            handler: newbug.createDelegate(this)
        }, {
            xtype: 'button',
            tooltip: "Remove selected bugs from test case or run",
            icon: 'extensions/testopia/img/delete.png',
            iconCls: 'img_button_16x',
            handler: removebug.createDelegate(this)
        }, '-', 'This view includes all bugs attached to the selected test case regardless of run'],
        border: false,
        title: 'Bugs',
        id: 'case_bugs_panel',
        bodyBorder: false,
        autoExpandColumn: 'bugs_summary',
        loadMask: {
            msg: 'Loading...'
        },
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: true
        })
    });
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.TestCase.Bugs.Grid, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        this.menu = new Ext.menu.Menu({
            id: 'tags-ctx-menu',
            items: [{
                text: 'Refresh List',
                icon: 'extensions/testopia/img/refresh.png',
                iconCls: 'img_button_16x',
                handler: function(){
                    grid.store.reload();
                }
            }, {
                text: 'Attach Selected Bug to Current Run/Build/Environment',
                id: 'reattach_bug',
                icon: 'extensions/testopia/img/add.png',
                disabled: Ext.getCmp('caserun_grid') ? false : true,
                iconCls: 'img_button_16x',
                handler: function(){
                    var r = grid.store.getAt(index);
                    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm', {});
                    testopia_form.submit({
                        url: 'tr_list_cases.cgi',
                        params: {
                            action: 'update_bugs',
                            bug_action: 'attach',
                            bugs: Testopia.Util.getSelectedObjects(Ext.getCmp('case_bugs_panel'), 'bug_id'),
                            type: 'caserun',
                            ids: Testopia.Util.getSelectedObjects(Ext.getCmp('caserun_grid'), 'caserun_id')
                        },
                        success: function(){
                            Ext.getCmp('caserun_grid').store.reload();
                            grid.store.reload();
                            Ext.getCmp('attachbug').reset();
                        },
                        failure: Testopia.Util.error
                    });
                }
            }]
        });
        e.stopEvent();
        if (grid.getSelectionModel().getCount() < 1) {
            grid.getSelectionModel().selectRow(index);
        }
        this.menu.showAt(e.getXY());
    },
    onActivate: function(event){
        this.store.load({
            params: {
                case_id: this.tcid
            }
        });
    }
});

Testopia.TestCase.Components = function(id){
    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm', {});
    var tcid;
    var product_id;
    if (id) {
        tcid = id;
    }
    else {
        if (Ext.getCmp('caserun_grid').getSelectionModel().getCount()) {
            tcid = Ext.getCmp('caserun_grid').getSelectionModel().getSelected().get('case_id');
        }
    }
    try {
        if (run) {
            product_id = run.plan.product_id;
        }
    } 
    catch (err) {
        try{
            if (tcase) {
                product_id = tcase.product_id;
            }
        }
        catch (e) {}
    }
    this.tcid = tcid;
    this.store = new Ext.data.JsonStore({
        url: 'tr_process_case.cgi',
        root: 'comps',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getcomponents'
        },
        id: 'component_id',
        fields: [{
            name: 'name',
            mapping: 'name'
        }, {
            name: 'id',
            mapping: 'id'
        }, {
            name: 'product',
            mapping: 'product'
        }]
    });
    var ds = this.store;
    this.columns = [{
        header: "ID",
        width: 150,
        dataIndex: 'id',
        sortable: false,
        hidden: true
    }, {
        id: 'comp_name',
        header: "Component",
        width: 150,
        dataIndex: 'name',
        sortable: true
    }, {
        id: 'product',
        header: "Product",
        width: 150,
        dataIndex: 'product',
        sortable: true
    }];
    
    var pchooser = new Testopia.Product.Combo({
        id: 'comp_product_chooser',
        mode: 'local',
        value: product_id
    });
    var compchooser = new Testopia.TestCase.ComponentCombo({
        params: {
            product_id: product_id
        }
    });
    this.pchooser = pchooser;
    pchooser.on('select', function(){
        compchooser.reset();
        compchooser.store.baseParams = {
            product_id: pchooser.getValue(),
            action: 'getcomponents'
        };
        compchooser.store.load();
    });
    addcomp = function(){
        tcid = this.tcid;
        if (typeof tcid == 'object') {
            testopia_form.submit({
                url: 'tr_list_cases.cgi',
                params: {
                    action: 'update',
                    comp_action: 'add',
                    components: compchooser.getValue(),
                    ids: Testopia.Util.getSelectedObjects(tcid, 'case_id')
                },
                success: function(){
                    Testopia.Util.notify.msg('Component Added', 'Added component {0} to {1} cases(s)', compchooser.getRawValue(), tcid.getSelectionModel().getCount());
                },
                failure: Testopia.Util.error
            });
            return;
        }
        testopia_form.submit({
            url: 'tr_process_case.cgi',
            params: {
                action: 'addcomponent',
                component_id: compchooser.getValue(),
                case_id: this.tcid
            },
            success: function(){
                ds.load({
                    params: {
                        case_id: tcid
                    }
                });
            },
            failure: Testopia.Util.error
        });
    };
    removecomp = function(){
        tcid = this.tcid;
        if (typeof tcid == 'object') {
            testopia_form.submit({
                url: 'tr_list_cases.cgi',
                params: {
                    action: 'update',
                    comp_action: 'rem',
                    components: compchooser.getValue(),
                    ids: Testopia.Util.getSelectedObjects(tcid, 'case_id')
                },
                success: function(){
                    Testopia.Util.notify.msg('Component Removed', 'Removed component {0} from {1} cases(s)', compchooser.getRawValue(), tcid.getSelectionModel().getCount());
                },
                failure: Testopia.Util.error
            });
            return;
        }
        testopia_form.submit({
            url: 'tr_process_case.cgi',
            params: {
                action: 'removecomponent',
                component_id: Testopia.Util.getSelectedObjects(Ext.getCmp('case_comps_panel'), 'id'),
                case_id: this.tcid
            },
            success: function(){
                ds.load({
                    params: {
                        case_id: tcid
                    }
                });
            },
            failure: Testopia.Util.error
        });
    };
    Testopia.TestCase.Components.superclass.constructor.call(this, {
        tbar: [pchooser, compchooser, {
            xtype: 'button',
            tooltip: "Attach selected component",
            icon: 'extensions/testopia/img/add.png',
            iconCls: 'img_button_16x',
            handler: addcomp.createDelegate(this)
        }, {
            xtype: 'button',
            tooltip: "Remove component from test case",
            icon: 'extensions/testopia/img/delete.png',
            iconCls: 'img_button_16x',
            handler: removecomp.createDelegate(this)
        
        }],
        border: false,
        title: 'Components',
        id: 'case_comps_panel',
        bodyBorder: false,
        autoExpandColumn: 'comp_name',
        loadMask: {
            msg: 'Loading...'
        },
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false
        })
    });
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.TestCase.Components, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'tags-ctx-menu',
                items: [{
                    text: 'Refresh List',
                    icon: 'extensions/testopia/img/refresh.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        grid.store.reload();
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
    onActivate: function(event){
        this.store.load({
            params: {
                case_id: this.tcid
            },
            callback: function(r, o, s){
                if (s === false) {
                    Testopia.Util.loadError();
                }
            }
        });
        this.pchooser.store.load();
    }
});

Testopia.TestCase.Bugs.update = function(grid){
    function commitBug(action, value, grid){
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        form.submit({
            url: 'tr_list_cases.cgi',
            params: {
                action: 'update_bugs',
                bug_action: action,
                bugs: value,
                type: 'case',
                ids: Testopia.Util.getSelectedObjects(grid, 'case_id')
            },
            success: function(){
            },
            failure: Testopia.Util.error
        });
    }
    var win = new Ext.Window({
        title: 'Add or Remove Bugs',
        id: 'bugs_edit_win',
        layout: 'fit',
        split: true,
        plain: true,
        shadow: false,
        listeners: {'afterlayout':function(){Ext.getCmp('bug_field').focus('',10)}},
        width: 350,
        height: 150,
        items: [new Ext.FormPanel({
            labelWidth: '40',
            bodyStyle: 'padding: 5px',
            items: [{
                xtype: 'textfield',
                name: 'bugs',
                id: 'bug_field',
                fieldLabel: 'Bugs'
            }]
        })],
        buttons: [{
            text: 'Attach Bug',
            handler: function(){
                commitBug('attach', Ext.getCmp('bug_field').getValue(), grid);
                win.close();
            }
        }, {
            text: 'Remove Bug',
            handler: function(){
                commitBug('remove', Ext.getCmp('bug_field').getValue(), grid);
                win.close();
            }
        }, {
            text: 'Close',
            handler: function(){
                win.close();
            }
        }]
    });
    win.show();
};
