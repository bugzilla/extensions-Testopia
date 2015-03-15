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

Testopia.Search.save = function(type, params){
    var loc;
    var ntype;
    
    if (type == 'dashboard') {
        ntype = 3;
        loc = Testopia.Search.dashboard_urls.join('::>');
    }
    else 
        if (type == 'custom') {
            loc = params;
            params = {
                report: true
            };
            ntype = 1;
        }
        else {
            if (type == 'caserun') {
                params.current_tab = 'case_run';
            }
            else {
                params.current_tab = type;
            }
            if (params.report) {
                loc = 'tr_' + type + '_reports.cgi?';
                ntype = 1;
            }
            else {
                loc = 'tr_list_' + type + 's.cgi?';
                ntype = 0;
            }
            loc = loc + Testopia.Util.JSONToURLQuery(params, '', ['ctype']);
        }
    var form = new Ext.form.BasicForm('testopia_helper_frm', {});
    Ext.Msg.prompt('Save As', '', function(btn, text){
        if (btn == 'ok') {
            form.submit({
                url: 'tr_query.cgi',
                params: {
                    action: 'save_query',
                    query_name: text,
                    query_part: loc,
                    type: ntype
                },
                success: function(){
                    if (Ext.getCmp('searches_grid')) {
                        Ext.getCmp('searches_grid').store.load();
                    }
                    if (Ext.getCmp('reports_grid')) {
                        Ext.getCmp('reports_grid').store.load();
                    }
                    if (Ext.getCmp('dashboard_grid')) {
                        Ext.getCmp('dashboard_grid').store.load();
                    }
                    Testopia.Util.notify.msg('Saved', 'Your search or report was saved.');
                },
                failure: Testopia.Util.error
            });
        }
    });
};

Testopia.Search.fillInForm = function(type, params, name){
    var f = document.getElementById(type + '_search_form');
    for (var i=0; i < f.length; i++){
        if (f[i].type == 'select-multiple'){
            for (k=0; k < f[i].options.length; k++){
                f[i].options[k].selected = false;
            }
                
            var list = params[f[i].name];
            if(!list){
                continue;
            }
            if (typeof list != 'object'){
                list = new Array(list);
            }
            for (j=0; j < list.length; j++){
                for (k=0; k < f[i].options.length; k++){
                    if(f[i].options[k].value == list[j]){
                        f[i].options[k].selected = true;
                        break;
                    }
                }
            }
        }
        else{
            if (params[f[i].name]){
                f[i].value = params[f[i].name] || '';
            }
        }
    }
};

Testopia.Search.DashboardPanel = function(cfg){
    Testopia.Search.DashboardPanel.superclass.constructor.call(this, {
        title: cfg.title || 'Dashboard',
        layout: 'fit',
        closable: cfg.closable || false,
        id: cfg.id || 'dashboardpanel',
        tbar: [{
            xtype: 'button',
            text: 'Add Custom Panel',
            handler: function(b, e){
                Ext.Msg.prompt('Enter URL', '', function(btn, text){
                    if (btn == 'ok') {
                        var url = text + '&noheader=1';
                        Testopia.Search.dashboard_urls.push(url);
                        var newPortlet = new Ext.ux.Portlet({
                            title: 'Custom',
                            closable: true,
                            autoScroll: true,
                            tools: PortalTools,
                            url: url
                        });
                        
                        Ext.getCmp('dashboard_leftcol').add(newPortlet);
                        Ext.getCmp('dashboard_leftcol').doLayout();
                        newPortlet.load({
                            url: url,
                            scripts: false
                        });
                    }
                });
            }
        }, new Ext.Toolbar.Fill()],
        items: [{
            xtype: 'portal',
            margins: '35 5 5 0',
            items: [{
                columnWidth: 0.5,
                baseCls: 'x-plain',
                bodyStyle: 'padding:10px 10px 10px 10px',
                id: cfg.lc || 'dashboard_leftcol',
                items: [{
                    title: ' ',
                    hidden: true
                }]
            }, {
                columnWidth: 0.5,
                baseCls: 'x-plain',
                bodyStyle: 'padding:10px 10px 10px 10px',
                id: cfg.rc || 'dashboard_rightcol',
                items: [{
                    title: ' ',
                    hidden: true
                }]
            }]
        }]
    });
    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.Search.DashboardPanel, Ext.Panel, {
    onActivate: function(p){
        p.doLayout();
    }
});

Testopia.Search.Popup = function(tab, params){
    var win = new Ext.Window({
        id: 'search_win',
        closable: true,
        width: Ext.getBody().getViewSize().width - 150,
        height: Ext.getBody().getViewSize().height - 150,
        plain: true,
        shadow: false,
        layout: 'fit',
        items: [new Testopia.Search.Panel(tab, params)]
    });
    win.show();
};

Testopia.Search.Panel = function(tab, params){
    params = params || {};

    Testopia.Search.Panel.superclass.constructor.call(this,{
        title: 'Create a Search',
        id: 'search_panel',
        autoScroll: true,
        activeTab: tab + '_search_panel',
        defaults: {
        // applied to each contained panel
            bodyStyle:'padding:10px',
            autoScroll: true
        },
        items:[
            new Testopia.Search.PlansForm(params),
            new Testopia.Search.CasesForm(params),
            new Testopia.Search.RunsForm(params),
            new Testopia.Search.CaseRunsForm(params)
        ]
    });
};
Ext.extend(Testopia.Search.Panel, Ext.TabPanel);

Testopia.Search.PlansForm = function(params){
    this.params = params;
    Testopia.Search.PlansForm.superclass.constructor.call(this,{
        title: 'Plan Search',
        id: 'plan_search_panel',
        layout:'fit',
        autoLoad: {
            url: 'tr_query.cgi?current_tab=plan',
            params: params,
            scripts: true,
            text: 'Loading search form...',
            callback: Testopia.Search.fillInForm.createDelegate(this,['plan',this.params])
        },
        buttons:[{
            text: 'Submit',
            handler: function(){
                var form = new Ext.form.BasicForm('plan_search_form');
                var values = form.getValues();
                var searchnum = Math.round(Math.random()*100);
                try {
                    // EXT BUG - Closing always causes an error: 
                    // http://extjs.com/forum/showthread.php?t=20930
                    Ext.getCmp('search_win').close();
                }
                catch(err){}
                if (params.report){
                    values.id = 'tr_plan_reports.html';
                    Ext.getCmp('object_panel').add(new Ext.Panel({
                        id: 'plan_search' + searchnum, 
                        closable: true,
                        title: 'Plan Report',
                        autoScroll: true,
                        listeners: { 'render': function(){
                            this.load({
                                url: 'page.cgi',
                                params: values
                            });
                        }},
                        tbar:[new Ext.Toolbar.Fill(),
                        {
                            xtype: 'button',
                            id: 'save_plan_report_btn',
                            icon: 'extensions/Testopia/img/save.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Save this report',
                            handler: function(b,e){
                                Testopia.Search.save('plan', values);
                            }
                        },{
                            xtype: 'button',
                            id: 'link_plan_report_btn',
                            icon: 'extensions/Testopia/img/link.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Create a link to this report',
                            handler: function(b,e){
                                Testopia.Search.LinkPopup(values);
                            }
                        }]
                    }));
                    Ext.getCmp('object_panel').activate('plan_search' + searchnum);
                }
                else{
                    Ext.getCmp('object_panel').add(new Testopia.TestPlan.Grid(values,{
                        id: 'plan_search' + searchnum, 
                        closable: true,
                        title: 'Plan Search'
                    }));
                    Ext.getCmp('object_panel').activate('plan_search' + searchnum);
                }
            }
        }]
    });

    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.Search.PlansForm, Ext.Panel,{
    onActivate: function(event){
        if (!this.rendered){
            return;
        }
        if (Ext.get('case_search_form')){
            Ext.get('case_search_form').remove();
        }
        if (Ext.get('run_search_form')){
            Ext.get('run_search_form').remove();
        }
        if (Ext.get('caserun_search_form')){
            Ext.get('caserun_search_form').remove();
        }

        this.params.current_tab = 'plan';
        this.load({
            url: 'tr_query.cgi',
            params: this.params,
            scripts: true,
            text: 'Loading search form...',
            callback: Testopia.Search.fillInForm.createDelegate(this,['plan',this.params])
        });
    }
});

Testopia.Search.CasesForm = function(params){
    this.params = params;
    Testopia.Search.CasesForm.superclass.constructor.call(this,{
        title: 'Case Search',
        id: 'case_search_panel',
        layout:'fit',
        autoLoad: {
            url: 'tr_query.cgi?current_tab=case',
            params: params,
            scripts: true,
            text: 'Loading search form...',
            callback: Testopia.Search.fillInForm.createDelegate(this,['case',this.params])
        },
        buttons:[{
            text: 'Submit',
            handler: function(){
                var form = new Ext.form.BasicForm('case_search_form');
                var values = form.getValues();
                var searchnum = Math.round(Math.random()*100);
                try {
                    // EXT BUG - Closing always causes an error: 
                    // http://extjs.com/forum/showthread.php?t=20930
                    Ext.getCmp('search_win').close();
                }
                catch(err){}
                if (params.report){
                    values.id = 'tr_case_reports.html';
                    Ext.getCmp('object_panel').add(new Ext.Panel({
                        id: 'case_search' + searchnum, 
                        closable: true,
                        title: 'Case Report',
                        autoScroll: true,
                        listeners: { 'render': function(){
                            this.load({
                                url: 'page.cgi',
                                params: values
                            });
                        }},
                        tbar:[new Ext.Toolbar.Fill(),
                        {
                            xtype: 'button',
                            id: 'save_case_report_btn',
                            icon: 'extensions/Testopia/img/save.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Save this report',
                            handler: function(b,e){
                                Testopia.Search.save('case', values);
                            }
                        },{
                            xtype: 'button',
                            id: 'link_case_report_btn',
                            icon: 'extensions/Testopia/img/link.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Create a link to this report',
                            handler: function(b,e){
                                Testopia.Search.LinkPopup(values);
                            }
                        }]
                    }));
                    Ext.getCmp('object_panel').activate('case_search' + searchnum);
                }
                else{
                    Ext.getCmp('object_panel').add(new Testopia.TestCase.Grid(values,{
                        id: 'case_search' + searchnum, 
                        closable: true,
                        title: 'Case Search'
                    }));
                }
                Ext.getCmp('object_panel').activate('case_search' + searchnum);
            }
        }]
    });

    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.Search.CasesForm, Ext.Panel,{
    onActivate: function(event){
        if (!this.rendered){
            return;
        }
        if (Ext.get('run_search_form')){
            Ext.get('run_search_form').remove();
        }
        if (Ext.get('plan_search_form')){
            Ext.get('plan_search_form').remove();
        }
        if (Ext.get('caserun_search_form')){
            Ext.get('caserun_search_form').remove();
        }

        this.params.current_tab = 'case';
        this.load({
            url: 'tr_query.cgi',
            params: this.params,
            scripts: true,
            text: 'Loading search form...',
            callback: Testopia.Search.fillInForm.createDelegate(this,['case',this.params])
        });
    }
});

Testopia.Search.RunsForm = function(params){
    this.params = params;
    Testopia.Search.RunsForm.superclass.constructor.call(this,{
        title: 'Run Search',
        id: 'run_search_panel',
        layout:'fit',
        autoLoad: {
            url: 'tr_query.cgi?current_tab=run',
            params: params,
            scripts: true,
            text: 'Loading search form...',
            callback: Testopia.Search.fillInForm.createDelegate(this,['run',this.params])
        },
        buttons:[{
            text: 'Submit',
            handler: function(){
                var form = new Ext.form.BasicForm('run_search_form');
                var values = form.getValues();
                if (params.qname)
                    values.qname = params.qname;
                var searchnum = Math.round(Math.random()*100);
                try {
                    // EXT BUG - Closing always causes an error: 
                    // http://extjs.com/forum/showthread.php?t=20930
                    Ext.getCmp('search_win').close();
                }
                catch(err){}
                if (params.report){
                    Ext.getCmp('object_panel').add(new Ext.Panel({
                        id: 'run_search' + searchnum, 
                        closable: true,
                        title: 'Run Report',
                        autoScroll: true,
                        listeners: { 'render': function(){
                            this.load({
                                url: 'tr_run_reports.cgi',
                                params: values
                            });
                        }},
                        tbar:[new Ext.Toolbar.Fill(),
                        {
                            xtype: 'button',
                            id: 'save_run_report_btn',
                            icon: 'extensions/Testopia/img/save.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Save this report',
                            handler: function(b,e){
                                Testopia.Search.save('run', values);
                            }
                        },{
                            xtype: 'button',
                            id: 'link_run_report_btn',
                            icon: 'extensions/Testopia/img/link.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Create a link to this report',
                            handler: function(b,e){
                                Testopia.Search.LinkPopup(values);
                            }
                        }]
                    }));
                    Ext.getCmp('object_panel').activate('run_search' + searchnum);
                }
                else{
                    Ext.getCmp('object_panel').add(new Testopia.TestRun.Grid(values,{
                        id: 'run_search' + searchnum, 
                        closable: true,
                        title: 'Run Search'
                    }));
                }
                Ext.getCmp('object_panel').activate('run_search' + searchnum);
            }
        }]
    });

    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.Search.RunsForm, Ext.Panel,{
    onActivate: function(event){
        if (!this.rendered){
            return;
        }
        if (Ext.get('case_search_form')){
            Ext.get('case_search_form').remove();
        }
        if (Ext.get('plan_search_form')){
            Ext.get('plan_search_form').remove();
        }
        if (Ext.get('caserun_search_form')){
            Ext.get('caserun_search_form').remove();
        }

        this.params.current_tab = 'run';
        this.load({
            url: 'tr_query.cgi',
            params: this.params,
            scripts: true,
            text: 'Loading search form...',
            callback: Testopia.Search.fillInForm.createDelegate(this,['run',this.params])
        });
    }
});

Testopia.Search.CaseRunsForm = function(params){
    this.params = params;
    Testopia.Search.CaseRunsForm.superclass.constructor.call(this,{
        title: 'Case-Run Search',
        id: 'caserun_search_panel',
        layout:'fit',
        autoLoad:{
            url: 'tr_query.cgi?current_tab=case_run',
            params: params,
            scripts: true,
            text: 'Loading search form...',
            callback: Testopia.Search.fillInForm.createDelegate(this,['caserun',this.params])
        },
        buttons:[{
            text: 'Submit',
            handler: function(){
                var form = new Ext.form.BasicForm('caserun_search_form');
                var values = form.getValues();
                var searchnum = Math.round(Math.random()*100);
                try {
                    // EXT BUG - Closing always causes an error: 
                    // http://extjs.com/forum/showthread.php?t=20930
                    Ext.getCmp('search_win').close();
                }
                catch(err){}
                if (params.report){
                    values.id = 'tr_caserun_reports.html';
                    Ext.getCmp('object_panel').add(new Ext.Panel({
                        id: 'case_run_search' + searchnum, 
                        closable: true,
                        title: 'Case-Run Report',
                        autoScroll: true,
                        listeners: { 'render': function(){
                            this.load({
                                url: 'page.cgi',
                                params: values
                            });
                        }},
                        tbar:[new Ext.Toolbar.Fill(),
                        {
                            xtype: 'button',
                            id: 'save_caserun_report_btn',
                            icon: 'extensions/Testopia/img/save.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Save this report',
                            handler: function(b,e){
                                Testopia.Search.save('caserun', values);
                            }
                        },{
                            xtype: 'button',
                            id: 'link_plan_list_btn',
                            icon: 'extensions/Testopia/img/link.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Create a link to this report',
                            handler: function(b,e){
                                Testopia.Search.LinkPopup(values);
                            }
                        }]
                    }));
                    Ext.getCmp('object_panel').activate('case_run_search' + searchnum);
                }
                else{
                    Ext.getCmp('object_panel').add(new Testopia.TestCaseRun.List(values,{
                        id: 'case_run_search' + searchnum, 
                        closable: true,
                        title: 'Case-Run Search'
                    }));
                }
                Ext.getCmp('object_panel').activate('case_run_search' + searchnum);
            }
        }]
    });

    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.Search.CaseRunsForm, Ext.Panel,{
    onActivate: function(event){
        if (!this.rendered){
            return;
        }
        if (Ext.get('case_search_form')){
            Ext.get('case_search_form').remove();
        }
        if (Ext.get('run_search_form')){
            Ext.get('run_search_form').remove();
        }
        if (Ext.get('plan_search_form')){
            Ext.get('plan_search_form').remove();
        }
        this.params.current_tab = 'case_run';
        this.load({
            url: 'tr_query.cgi',
            params: this.params,
            scripts: true,
            text: 'Loading search form...',
            callback: Testopia.Search.fillInForm.createDelegate(this,['caserun',this.params])
        });
    }
});

Testopia.Search.SavedReportsList = function(cfg){
    
    this.store = new Ext.data.JsonStore({
        url: 'tr_query.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {action: 'get_saved_searches', type: cfg.type},
        root: 'searches',
        fields: ["name","query","author","type"]
    });
    var ds = this.store;
    var current_col = 'dashboard_leftcol';
    
    this.columns = [
        {header: "Name", width: 30, dataindex: "name", sortable: true}
    ];
    
    Testopia.Search.SavedReportsList.superclass.constructor.call(this, {
        id: cfg.id || "reports_grid",
        loadMask: {msg: "Loading ..."},
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: true,
            listeners: {'rowselect': function(sm, i, r){
                var name = r.get('name');
                if(r.get('type') == 1){
                    Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                    var newPortlet = new Ext.ux.Portlet({
                        title: name,
                        id: name,
                        closable: true,
                        autoScroll: true,
                        tools: PortalTools,
                        url: r.get('query')
                    });
                    
                    Ext.getCmp(current_col).add(newPortlet);
                    Ext.getCmp(current_col).doLayout();
                    Testopia.Search.dashboard_urls.push(r.get('query'));
                    newPortlet.load({
                        scripts: true,
                        url: r.get('query')
                    });
                    current_col = current_col == 'dashboard_leftcol' ? 'dashboard_rightcol' : 'dashboard_leftcol';
                }
                else{
                    sm.grid.loadPanel(r);
                }
            }}
        }),
        viewConfig: {
            forceFit:true
        }
    });
    Ext.apply(this,cfg);
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.Search.SavedReportsList, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        var d = grid.store.getAt(index).get('query').match(/(tr_list_|_reports)/);
        if (d){
            var g = grid.store.getAt(index).get('query').match(/completion/);
            if (g)
                d = null;
        }
        this.menu = new Ext.menu.Menu({
            id:'run-ctx-menu',
            enableScrolling: false,
            items: [{
                text: 'Open in a new tab', 
                disabled: d ? false : true,
                handler: function(){
                    var r = grid.store.getAt(index);
                    if (r.get('type') == 0){
                        grid.loadPanel(r);
                    }
                    else{
                        var newTab = new Ext.Panel({
                            title: r.get('name'),
                            closable: true,
                            id: 'search' + r.get('name'),
                            autoScroll: true
                        });
                        Ext.getCmp('object_panel').add(newTab);
                        Ext.getCmp('object_panel').activate('search' + r.get('name'));
                        newTab.load({
                            url: r.get('query')
                        });
                    }
                    
                }
            },{
                text: 'Edit', 
                icon: 'extensions/Testopia/img/edit.png',
                iconCls: 'img_button_16x',
                disabled: d ? false : true,
                handler: function(){
                    var r = grid.store.getAt(index);
                    var name = r.get('name');
                    var q = r.get('query');
                    var type;
                    type = q.match(/tr_list_(run|case|plan|caserun)s/);
                    if (!type) {
                        type = q.match(/tr_(run|case|plan|caserun)_reports/);
                        if (!type) {
                            Ext.Msg.show({
                                title: "Non-editable",
                                msg: "This Search or Report cannot be edited",
                                icon: Ext.MessageBox.ERROR,
                                buttons: Ext.MessageBox.OK
                            });
                            return;
                        }
                    }
                    type = type[1];
                    
                    var params = Testopia.Util.urlQueryToJSON(r.get('query'));
                    Testopia.Search.Popup(type, params);
                }
            },{
                text: 'Delete',
                icon: 'extensions/Testopia/img/delete.png',
                iconCls: 'img_button_16x',
                handler: function (){
                    var form = new Ext.form.BasicForm('testopia_helper_frm',{});
                    Ext.Msg.show({
                        msg: 'Are you sure you want to delete this search?',
                        buttons: Ext.MessageBox.YESNO,
                        icon: Ext.MessageBox.QUESTION,
                        fn: function(btn, text){
                            if (btn == 'yes'){
                                var r = grid.store.getAt(index);
                                form.submit({
                                    url: 'tr_query.cgi',
                                    params: {action: 'delete_query', query_name: r.get('name')},
                                    success: function(){
                                        if (grid){
                                            grid.store.load();
                                        }
                                    },
                                    failure: Testopia.Util.error
                                });
                            }
                        }
                    });
                }
            },{
                text: 'Refresh List',
                icon: 'extensions/Testopia/img/refresh.png',
                iconCls: 'img_button_16x',
                handler: function(){
                    grid.store.reload();
                }
            }]
        });
        e.stopEvent();
        this.menu.showAt(e.getXY());
    },
    onActivate: function(event){
        if (!this.store.getCount()){
            this.store.load();
        }
    },
    loadPanel: function(r){
        var cfg = {
            id: 'search' + r.get('name'), 
            closable: true,
            title: r.get('name'),
            lc: 'lc_' + r.get('name'),
            rc: 'rc_' + r.get('name')
        };
        if (r.get('type') == 3){
            Ext.getCmp('object_panel').add(new Testopia.Search.DashboardPanel(cfg));
            Ext.getCmp('object_panel').activate('search' + r.get('name'));
            Ext.getCmp('search' + r.get('name')).getTopToolbar().add({
                xtype: 'button',
                id: 'link_dashboard_btn',
                icon: 'extensions/Testopia/img/link.png',
                iconCls: 'img_button_16x',
                tooltip: 'Create a link to this dashboard',
                handler: function(b,e){
                    var l = window.location;
                    var pathprefix = l.pathname.match(/(.*)[\/\\]([^\/\\]+\.\w+)$/);
                    pathprefix = pathprefix[1];
                    var win = new Ext.Window({
                        width: 300,
                        plain: true,
                        shadow: false,
                        items: [new Ext.form.TextField({
                            value: encodeURI(l.protocol + '//' + l.host + pathprefix + '/' + 'tr_show_product.cgi?dashboard=' + r.get('name') + '&userid=' + Testopia_user.id),
                            width: 287
                        })]
                    });
                    win.show();
                }
            });
            
            var current_col = 'lc_' + r.get('name');
            var urls = r.get('query').split('::>');
            var newPortlet;
            for (var i in urls){
                if (typeof urls[i] != 'string'){
                    continue;
                }
                var p = Testopia.Util.urlQueryToJSON(urls[i]);
                var t;
                typeof p.qname == 'object' ? t = p.qname[0] : t = p.qname;
                newPortlet = new Ext.ux.Portlet({
                    title: t || ' ',
                    id: 'search' + r.get('name') + i,
                    closable: true,
                    autoScroll: true,
                    tools: PortalTools,
                    url: urls[i]
                });
                Ext.getCmp(current_col).add(newPortlet);
                Ext.getCmp(current_col).doLayout();
                current_col = current_col == 'lc_' + r.get('name') ? 'rc_' + r.get('name') : 'lc_' + r.get('name');

                newPortlet.load({
                    scripts: true,
                    url: urls[i]
                });
            }
        }
        else{
            var params = Testopia.Util.urlQueryToJSON(r.get('query'));
            var tab = params.current_tab;
            switch(tab){
                case 'plan':
                    Ext.getCmp('object_panel').add(new Testopia.TestPlan.Grid(params,cfg));
                    break;
                case 'run':
                    Ext.getCmp('object_panel').add(new Testopia.TestRun.Grid(params,cfg));
                    break;
                case 'case':
                    Ext.getCmp('object_panel').add(new Testopia.TestCase.Grid(params,cfg));
                    break;
                default:
                    Ext.Msg.show({
                        title:'No Type Found',
                        msg: 'There must have been a problem saving this search. I can\'t find a type',
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.ERROR
                    });
                    return;
            }
            Ext.getCmp('object_panel').activate('search' + r.get('name'));
        }
    }
});

PortalTools = [{
    id:'gear',
    handler: function(e,target,panel){
        var form = new Ext.form.BasicForm('testopia_helper_frm',{});
        this.menu = new Ext.menu.Menu({
            id: 'portal_tools_menu',
            items: [
            {
                text: 'Save',
                handler: function(){
                     Ext.Msg.prompt('Save Report As', '', function(btn, text){
                        if (btn == 'ok'){
                            form.submit({
                                url: 'tr_query.cgi',
                                params: {action: 'save_query', query_name: text, query_part: panel.url, type: 1},
                                success: function(){
                                    Ext.getCmp('reports_grid').store.load();
                                    panel.title = text;
                                },
                                failure: Testopia.Util.error
                            });
                        }
                    });
                }
            },{
                text: 'Refresh',
                icon: 'extensions/Testopia/img/refresh.png',
                iconCls: 'img_button_16x',
                handler: function(){
                    panel.load({url: panel.url});
                }
            },{
                text: 'Link to this report',
                handler: function(){
                    var path;
                    if (panel.url.match(/^http/)){
                        path = panel.url;
                        path = path.replace(/\&noheader=1/gi, '');
                    }
                    else{
                        var l = window.location;
                        var pathprefix = l.pathname.match(/(.*)[\/\\]([^\/\\]+\.\w+)$/);
                        pathprefix = pathprefix[1];
                        path = l.protocol + '//' + l.host + pathprefix + '/' + panel.url;
                        path = path.replace(/\&noheader=1/gi, '');
                    }
                    var win = new Ext.Window({
                        width: 300,
                        plain: true,
                        shadow: false,
                        items: [new Ext.form.TextField({
                            value: path,
                            width: 287
                        })]
                    });
                    win.show();
                }
            },{
                text: 'Delete',
                handler: function(){
                     Ext.Msg.show({
                        title:'Confirm Delete?',
                        icon: Ext.MessageBox.QUESTION,
                        msg: 'Are you sure you want to delete this report?',
                        buttons: Ext.Msg.YESNO,
                        fn: function(btn, text){
                            if (btn == 'yes'){
                                form.submit({
                                    url: 'tr_query.cgi',
                                    params: {action: 'delete_query', query_name: panel.title},
                                    success: function(){
                                        Ext.getCmp('reports_grid').store.load();
                                        panel.ownerCt.remove(panel, true);
                                    },
                                    failure: Testopia.Util.error
                                });
                            }
                        }
                    });
                }
            }]
        });
        e.stopEvent();
        this.menu.showAt(e.getXY());
    }
},{
    id:'close',
    handler: function(e, target, panel){
        panel.ownerCt.remove(panel, true);
    }
}];

Testopia.Search.LinkPopup = function(params){
    if (params.current_tab == 'case_run') {
        params.current_tab = 'caserun';
    }
    var file;
    if (params.report) {
        file = 'tr_' + params.current_tab + '_reports.cgi';
    }
    else {
        file = 'tr_list_' + params.current_tab + 's.cgi';
    }
    var l = window.location;
    var pathprefix = l.pathname.match(/(.*)[\/\\]([^\/\\]+\.\w+)$/);
    pathprefix = pathprefix[1];
    
    var win = new Ext.Window({
        width: 300,
        plain: true,
        shadow: false,
        items: [new Ext.form.TextField({
            value: l.protocol + '//' + l.host + pathprefix + '/' + file + '?' + Testopia.Util.JSONToURLQuery(params, '', ['ctype']),
            width: 287
        })]
    });
    win.show();
};
