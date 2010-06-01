/*
 * JavaScript file created by Rockstarapps Concatenation
*/

/*
 * START OF FILE - /bnc/extensions/testopia/js/strings.js
 */
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
 * 
 */

ATTACHMENT_DELETE_WARNING = 'You are about to remove the selected attachments. This cannot be undone. Continue?';
CASE_CATEGORY_DELETE_WARNING = 'You are about to delete the selected test case category.  Are you sure you want to continue?';
CASE_DELETE_WARNING = 'You are about to delete the selected test cases including all children and history. This action cannot be undone. Are you sure you want to continue?';
PLAN_DELETE_WARNING = 'You are about to delete the selected test plans including all children and history. This action cannot be undone. Are you sure you want to continue?';
RUN_DELETE_WARNING = 'You are about to delete the selected test runs including all children and history. This action cannot be undone. Are you sure you want to continue?';
CASERUN_DELETE_WARNING = 'You are about to remove the selected test cases from this run including all history. This action cannot be undone. Are you sure you want to continue?';
ENVIRONMENT_DELETE_WARNING = 'You are about to delete the selected test environment including associated test run data. This action cannot be undone. Are you sure you want to continue?';
PRODUCT_PLAN_IMPORT = 'Accepts XML files under 2 MB in size. <br> See <a href="extensions/testopia/testopia.xsd" target="_blank">testopia.xsd</a> for proper format.';
PLAN_CASES_IMPORT = 'Accepts CSV and XML files under 2 MB in size. <br> See <a href="extensions/testopia/import_example.csv" target="_blank">import_example.csv</a> and <a href="extensions/testopia/testopia.xsd" target="_blank">testopia.xsd</a> for proper format.';
/*
 * END OF FILE - /bnc/extensions/testopia/js/strings.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/vars.js
 */
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
 */

// Set up the Testopia Namespace
var Testopia = {};

Testopia.Attachment = {};
Testopia.Build = {};
Testopia.TestCase = {};
Testopia.TestCase.Bugs = {};
Testopia.TestCaseRun = {};
Testopia.Category = {};
Testopia.Environment = {};
Testopia.TestPlan = {};
Testopia.TestRun = {};
Testopia.Search = {};
Testopia.Tags = {};
Testopia.Util = {};
Testopia.Product = {};
Testopia.User = {};

Testopia.Search.dashboard_urls = [];

// There are a number of Ext defaults that we want to override.
// This sets cookies to never expire.
Ext.state.Manager.setProvider(new Ext.state.CookieProvider({
    expires: new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 30))
}));

// 2 minute limit on data retrievals
Ext.data.Connection.timeout = 120000;
Ext.Updater.defaults.timeout = 120000;
Ext.Ajax.timeout = 120000;

Ext.BLANK_IMAGE_URL = 'extensions/testopia/extjs/resources/images/default/s.gif'; 

// Customized handler for the search field in the paging toolbar.
// From JeffHowden at http://extjs.com/forum/showthread.php?t=17532
Ext.override(Ext.form.Field, {
    fireKey: function(e){
        if (((Ext.isIE && e.type == 'keydown') || e.type == 'keypress') && e.isSpecialKey()) {
            this.fireEvent('specialkey', this, e);
        }
        else {
            this.fireEvent(e.type, this, e);
        }
    },
    initEvents: function(){
        //                this.el.on(Ext.isIE ? "keydown" : "keypress", this.fireKey,  this);
        this.el.on("focus", this.onFocus, this);
        this.el.on("blur", this.onBlur, this);
        this.el.on("keydown", this.fireKey, this);
        this.el.on("keypress", this.fireKey, this);
        this.el.on("keyup", this.fireKey, this);
        
        // reference to original value for reset
        this.originalValue = this.getValue();
    }
});// End Override

Ext.override(Ext.menu.Menu, {
    ignoreParentClicks: true,
    enableScrolling: false
});

//check column widget
Ext.grid.CheckColumn = function(config){
    Ext.apply(this, config);
    if (!this.id) {
        this.id = Ext.id();
    }
    this.renderer = this.renderer.createDelegate(this);
};

Ext.grid.CheckColumn.prototype = {
    init: function(grid){
        this.grid = grid;
        this.grid.on('render', function(){
            var view = this.grid.getView();
            view.mainBody.on('mousedown', this.onMouseDown, this);
        }, this);
    },
    
    onMouseDown: function(e, t){
        if (t.className && t.className.indexOf('x-grid3-cc-' + this.id) != -1) {
            e.stopEvent();
            var index = this.grid.getView().findRowIndex(t);
            var record = this.grid.store.getAt(index);
            record.set(this.dataIndex, !record.data[this.dataIndex]);
        }
    },
    
    renderer: function(v, p, record){
        p.css += ' x-grid3-check-col-td';
        return '<div class="x-grid3-check-col' + (v == '1' ? '-on' : '') + ' x-grid3-cc-' + this.id + '">&#160;</div>';
    }
};

var imgButtonTpl = new Ext.Template('<table border="0" cellpadding="0" cellspacing="0"><tbody><tr>' +
'<td><button type="button"><img src="{0}"></button></td>' +
'</tr></tbody></table>');

/*
 * END OF FILE - /bnc/extensions/testopia/js/vars.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/util.js
 */
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

Testopia.Util.displayStatusIcon = function(name){
    return '<img src="extensions/testopia/img/' + name + '_small.gif" alt="' + name + '" title="' + name + '">';
};

Testopia.Util.makeLink = function(id, m, r, ri, ci, s, type){
    if (type == 'bug') {
        if (s.isTreport === true) 
            return '<a href="show_bug.cgi?id=' + id + '" target="_blank">' + id + '</a>';
        return '<a href="show_bug.cgi?id=' + id + '">' + id + '</a>';
    }
    if (s.isTreport === true) 
        return '<a href="tr_show_' + type + '.cgi?' + type +'_id=' + id + '" target="_blank">' + id + '</a>';
    return '<a href="tr_show_' + type +'.cgi?' + type + '_id=' + id + '">' + id + '</a>';
};

Testopia.Util.CascadeProductSelection = function(){
    addOption = function(selectElement, newOption){
        try {
            selectElement.add(newOption, null);
        } 
        
        catch (e) {
            selectElement.add(newOption, selectElement.length);
        }
    };
    lsearch = function(val, arr){
        if (typeof arr != 'object') {
            if (arr == val) 
                return true;
            return false;
        }
        for (var i in arr) {
            if (arr[i] == val) 
                return true;
        }
        return false;
    };
    this.addOption = addOption;
    var fillSelects = function(data, prods){
        var s = Testopia.Util.urlQueryToJSON(window.location.search);
        if (prods) {
            s.product = prods;
        }
        for (var i in data.selectTypes) {
            if (typeof data.selectTypes[i] != 'function') {
                try {
                    document.getElementById(data.selectTypes[i]).options.length = 0;
                    for (var j in data[data.selectTypes[i]]) {
                        if (typeof data[data.selectTypes[i]][j] != 'function') {
                            var newOption = new Option(data[data.selectTypes[i]][j], data[data.selectTypes[i]][j], false, lsearch(data[data.selectTypes[i]][j], s[data.selectTypes[i]]));
                            addOption(document.getElementById(data.selectTypes[i]), newOption);
                        }
                    }
                    document.getElementById(data.selectTypes[i]).disabled = false;
                    document.getElementById(data.selectTypes[i])
                } 
                catch (err) {
                }
            }
        }
    };
    this.fillSelects = fillSelects;
    this.onProductSelection = function(prod){
        var ids = [];
        for (var i = 0; i < prod.options.length; i++) {
            if (prod.options[i].selected === true) {
                ids.push(prod.options[i].value);
            }
        }
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        var type = prod.id == 'classification' ? 'classification' : 'product';
        form.submit({
            url: "tr_query.cgi",
            params: {
                value: ids.join(","),
                action: "getversions",
                type: type
            },
            success: function(f, a){
                fillSelects(a.result.objects);
            },
            failure: Testopia.Util.error
        });
    };
    
    return this;
};



/*
 * Testopia.User.Lookup - This generates a typeahead lookup for usernames.
 * It can be used anywhere in Testopia. Extends Ext ComboBox
 */
Testopia.User.Lookup = function(cfg){
    Testopia.User.Lookup.superclass.constructor.call(this, {
        id: cfg.id || 'user_lookup',
        store: new Ext.data.JsonStore({
            url: 'tr_quicksearch.cgi',
            listeners: { 'exception': Testopia.Util.loadError },
            baseParams: {
                action: 'getuser'
            },
            root: 'users',
            totalProperty: 'total',
            id: 'login',
            fields: [{
                name: 'login',
                mapping: 'id'
            }, {
                name: 'name',
                mapping: 'name'
            }]
        }),
        listeners: {
            'valid': function(f){
                f.value = f.getRawValue();
            },
            'beforequery': function(o){
                if (cfg.multistring) {
                    var term = o.query.match(/(^.*),(.*)/);
                    if (term) {
                        o.combo.multivalue = term[1];
                        o.query = term[2];
                    }
                }
            },
            'select': function(c, r, i){
                if (cfg.multistring) {
                    var v = c.multivalue || '';
                    v = v ? v + ', ' + r.get('login') : r.get('login');
                    c.setValue(v);
                }
            }
        },
        queryParam: 'search',
        loadingText: 'Looking up users...',
        displayField: 'login',
        valueField: 'login',
        typeAhead: true,
        hideTrigger: true,
        minListWidth: 300,
        forceSelection: false,
        emptyText: 'Type a username...',
        pageSize: 20,
        tpl: '<tpl for="."><div class="x-combo-list-item"><table><tr><td>{name}</td></tr><tr><td><b>{login}</td></tr></table></div></tpl>'
    });
    Ext.apply(this, cfg);
};
Ext.extend(Testopia.User.Lookup, Ext.form.ComboBox);

//TODO: Implement this (see bug 340461)
DocCompareToolbar = function(object, id){
    var store = new Ext.data.JsonStore({
        url: 'tr_history.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'getdocversions',
            object: object,
            object_id: id
        },
        root: 'list',
        fields: [{
            name: 'id',
            mapping: 'id'
        }, {
            name: 'name',
            mapping: 'name'
        }]
    });
    this.toolbar = new Ext.Toolbar({
        id: 'doc_compare_tbar',
        items: [        //            new Ext.form.ComboBox({
        //                id: 'doc_compare_v1',
        //                store: store,
        //                displayField: 'name',
        //                valueField: 'id',
        //                width: 50,
        //                mode: 'local',
        //                triggerAction: 'all'
        //            }),
        //            new Ext.form.ComboBox({
        //                id: 'doc_compare_v2',
        //                store: store,
        //                displayField: 'name',
        //                valueField: 'id',
        //                width: 50,
        //                mode: 'local',
        //                triggerAction: 'all'
        //            }),{
        //                xtype: 'button',
        //                id: 'doc_compare_btn',
        //                text: 'Compare',
        //                handler: function(){
        //                    
        //                }
        //            },
        //            new Ext.Toolbar.Spacer(),
        //            new Ext.Toolbar.Separator(),
        new Ext.Toolbar.Fill(), new Ext.form.ComboBox({
            id: 'doc_view',
            store: store,
            displayField: 'name',
            valueField: 'id',
            width: 50,
            triggerAction: 'all'
        }), {
            xtype: 'button',
            id: 'doc_view_btn',
            text: 'View Version',
            handler: function(){
                var tab = Ext.getCmp('object_panel').add({
                    title: 'Version ' + Ext.getCmp('doc_view').getValue(),
                    closable: true,
                    autoScroll: true
                });
                tab.show();
                tab.load({
                    url: 'tr_history.cgi',
                    params: {
                        action: 'showdoc',
                        object: object,
                        object_id: id,
                        version: Ext.getCmp('doc_view').getValue()
                    },
                    failure: Testopia.Util.error
                });
            }
        }]
    });
    
    return this.toolbar;
};
/*
 * Testopia.Util.HistoryList -
 */
Testopia.Util.HistoryList = function(object, id){
    this.store = new Ext.data.JsonStore({
        url: 'tr_history.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'show',
            object: object,
            object_id: id
        },
        root: 'list',
        fields: [{
            name: "what",
            mapping: "what"
        }, {
            name: "who",
            mapping: "who"
        }, {
            name: "oldvalue",
            mapping: "oldvalue"
        }, {
            name: "newvalue",
            mapping: "newvalue"
        }, {
            name: "when",
            mapping: "changed"
        }]
    });
    this.columns = [{
        header: "What",
        width: 150,
        dataIndex: 'what',
        sortable: true
    }, {
        header: "Who",
        width: 180,
        sortable: true,
        dataIndex: 'who'
    }, {
        header: "When",
        width: 150,
        sortable: true,
        dataIndex: 'when'
    }, {
        header: "Old",
        width: 180,
        sortable: true,
        dataIndex: 'oldvalue'
    }, {
        id: 'new',
        header: "New",
        width: 180,
        sortable: true,
        dataIndex: 'newvalue'
    }];
    Testopia.Util.HistoryList.superclass.constructor.call(this, {
        title: 'Change History',
        id: 'history-grid',
        layout: 'fit',
        loadMask: {
            msg: 'Loading History...'
        },
        autoExpandColumn: "new",
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false
        })
    });
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
};
Ext.extend(Testopia.Util.HistoryList, Ext.grid.GridPanel, {
    onActivate: function(){
        if (!this.store.getCount()) {
            this.store.load();
        }
    },
    onContextClick: function(grid, index, e){
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'history-ctx-menu',
                enableScrolling: false,
                items: [{
                    text: 'Refresh',
                    icon: 'extensions/testopia/img/refresh.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        grid.store.reload();
                    }
                }]
            });
        }
        e.stopEvent();
        this.menu.showAt(e.getXY());
    }
    
});

Testopia.Util.PagingBar = function(type, store){
    this.type = type;
    var baseParams = clone(store.baseParams);
    function doUpdate(){
        this.updateInfo();
    }
    function clone(orig){
        var clone = new Object();
        for (var i in orig) {
            clone[i] = orig[i];
        }
        return clone;
    }
    function viewallUpdate(){
        this.cursor = 0;
        this.afterTextEl.el.innerHTML = String.format(this.afterPageText, 1);
        this.field.dom.value = 1;
        this.updateInfo();
    }
    var sizer = new Ext.form.ComboBox({
        store: new Ext.data.SimpleStore({
            fields: ['value', 'name'],
            id: 0,
            data: [[25, 25], [50, 50], [100, 100], [500, 500]],
            autoLoad: true
        }),
        id: type + '_page_sizer',
        mode: 'local',
        displayField: 'name',
        valueField: 'value',
        triggerAction: 'all',
        editable: false,
        width: 50
    });
    
    sizer.on('select', function(c, r, i){
        this.pageSize = r.get('value');
        Ext.state.Manager.set('TESTOPIA_DEFAULT_PAGE_SIZE', r.get('value'));
        store.baseParams.limit = r.get('value');
        store.load({
            params: {
                start: 0
            },
            callback: doUpdate.createDelegate(this)
        });
    }, this);
    this.sizer = sizer;
    var viewall = new Ext.Button({
        text: 'View All',
        enableToggle: true
    });
    viewall.on('toggle', function(b, p){
        if (p) {
            this.pageSize = 0;
            store.load({
                params: {
                    viewall: 1
                },
                callback: viewallUpdate.createDelegate(this)
            });
        }
        else {
            this.pageSize = sizer.getValue();
            store.load({
                params: {
                    start: 0,
                    limit: sizer.getValue()
                }
            });
        }
    }, this);
    var filter = new Ext.form.TextField({
        allowBlank: true,
        id: type + '_paging_filter',
        selectOnFocus: true
    });
    
    filter.on('specialkey', function(f, e){
        var key = e.getKey();
        if (key == e.ENTER) {
            var params = {
                start: 0,
                limit: sizer.getValue()
            };
            if (this.getValue().length === 0) {
                store.baseParams = clone(baseParams);
                store.load({
                    params: params
                });
                Ext.getCmp(type + '_filtered_txt').hide();
                return;
            }
            var params = {
                start: 0,
                limit: sizer.getValue()
            };
            var s = this.getValue();
            var term = s.match(/(^.*?):/);
            if (term) {
                term = term[1];
                var q = Testopia.Util.trim(s.substr(s.indexOf(':') + 1, s.length));
                if (term.match(/^start/i)) {
                    term = 'start_date';
                }
                if (term.match(/^stop/i)) {
                    term = 'stop_date';
                }
                if (term.match(/^manager/i)) {
                    term = 'manager';
                }
                switch (term) {
                    case 'status':
                        if (type == 'case') {
                            term = 'case_status';
                        }
                        else 
                            if (type == 'caserun') {
                                term = 'case_run_status';
                            }
                            else {
                                term = 'run_status';
                                if (q.match(/running/i)) {
                                    q = 0;
                                }
                                else {
                                    q = 1;
                                }
                            }
                        break;
                    case 'tester':
                        term = 'default_tester';
                        break;
                    case 'plan':
                        term = 'plan_id';
                        break;
                    case 'case':
                        term = 'case_id';
                        break;
                    case 'run':
                        term = 'run_id';
                        break;
                    case 'product_version':
                        term = 'default_product_version';
                        break;
                        
                }
                store.baseParams[term] = q;
                store.baseParams[term + '_type'] = 'substring';
            }
            else {
                if (type == 'case' || type == 'run') {
                    store.baseParams.summary = this.getValue();
                    store.baseParams.summary_type = 'allwordssubst';
                }
                else 
                    if (type == 'caserun') {
                        store.baseParams.case_summary = this.getValue();
                        store.baseParams.case_summary_type = 'allwordssubst';
                    }
                    else {
                        store.baseParams.name = this.getValue();
                        store.baseParams.name_type = 'allwordssubst';
                    }
            }
            store.load({
                params: params
            });
            Ext.getCmp(type + '_filtered_txt').show();
        }
        if ((key == e.BACKSPACE || key == e.DELETE) && this.getValue().length === 0) {
            store.baseParams = baseParams;
            store.load({
                params: {
                    start: 0,
                    limit: sizer.getValue()
                }
            });
            Ext.getCmp(type + '_filtered_txt').hide();
        }
    });
    
    sizer.on('render', function(){
        var tt = new Ext.ToolTip({
            target: type + '_paging_filter',
            title: 'Quick Search Filter',
            hideDelay: '500',
            html: "Enter column and search term separated by ':'<br> <b>Example:</b> priority: P3<br>Blank field and ENTER to clear"
        });
    });
    Testopia.Util.PagingBar.superclass.constructor.call(this, {
        id: type + '_pager',
        pageSize: Ext.state.Manager.get('TESTOPIA_DEFAULT_PAGE_SIZE', 25),
        displayInfo: true,
        displayMsg: 'Displaying test ' + type + 's {0} - {1} of {2}',
        emptyMsg: 'No test ' + type + 's were found',
        store: store,
        items: ['Filter: ', filter, ' ', '-', 'View ', ' ', sizer, ' ', viewall, ' ', 
        {
            type: 'tbtext',
            text: '(FILTERED)',
            hidden: true,
            id: type + '_filtered_txt',
            style: 'font-weight:bold;color:red'
        }]
    });
    this.on('render', this.setPager, this);
    this.cursor = 0;
};
Ext.extend(Testopia.Util.PagingBar, Ext.PagingToolbar, {
    setPager: function(){
        Ext.getCmp(this.type + '_page_sizer').setValue(Ext.state.Manager.get('TESTOPIA_DEFAULT_PAGE_SIZE', 25));
    }
});

Testopia.Util.updateFromList = function(type, params, grid){
    var form = new Ext.form.BasicForm('testopia_helper_frm', {});
    params.ctype = 'json';
    params.action = 'update';
    form.submit({
        url: 'tr_list_' + type + 's.cgi',
        params: params,
        success: function(f, a){
            if (type == 'caserun') {
                Ext.getCmp('run_progress').updateProgress(a.result.passed, a.result.failed, a.result.blocked, a.result.complete);
            }
            Testopia.Util.notify.msg('Test ' + type + 's updated', 'The selected {0}s were updated successfully', type);
            if (grid.selectedRows) {
                grid.store.baseParams.addcases = grid.selectedRows.join(',');
                Ext.getCmp(type + '_filtered_txt').show();
            }
            try {
                Ext.getCmp('case_details_panel').store.reload();
            } 
            catch (err) {
            }
            grid.store.reload({
                callback: function(){
                    if (grid.selectedRows) {
                        var sm = grid.getSelectionModel();
                        var sel = [];
                        for (var i = 0; i < grid.selectedRows.length; i++) {
                            var index = grid.store.find('case_id', grid.selectedRows[i]);
                            if (index >= 0) 
                                sel.push(index);
                        }
                        sm.selectRows(sel);
                        if (sm.getCount() < 1) {
                            Ext.getCmp('case_details_panel').disable();
                        }
                    }
                }
            });
        },
        failure: function(f, a){
            Testopia.Util.error(f, a);
            grid.store.reload({
                callback: function(){
                    if (grid.selectedRows) {
                        grid.getSelectionModel().selectRows(grid.selectedRows);
                    }
                }
            });
        }
    });
};

Testopia.Util.ComboRenderer = function(v, md, r, ri, ci, s){
    f = this.getColumnModel().getCellEditor(ci, ri).field;
    record = f.store.getById(v);
    if (record) {
        return record.data[f.displayField];
    }
    else {
        return v;
    }
};

/*
 * Testopia.Util.error - global public function for displaying Bugzilla error messages
 * when ERROR_MODE_AJAX is set. All failure branches of Ext.basicForm submit calls
 * should point here.
 */
Testopia.Util.error = function(f, a){
    f.el.unmask();
    var message;
    if (a.response.status && a.response.status != 200) {
        message = {
            title: 'System Error!',
            msg: a.response.responseText,
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.ERROR,
            minWidth: 450
        };
    }
    else {
        message = {
            title: 'An Error Has Occurred',
            msg: a.result.message,
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.ERROR,
            prompt: true,
            value: a.result.message,
            multiline: true,
            minWidth: 450
        };
    }
    Ext.Msg.show(message);
};

Testopia.Util.loadError = function(dp, errtype, a,o,r,ar,args){
    var message = 'There was an error loading the data: ';
    if (errtype == 'response'){
        message += r.responseText; 
    }
    Ext.Msg.show({
        title: 'An Error Has Occurred',
        width: 450,
        msg: message,
        prompt: true,
        multiline: true,
        value: message,
        buttons: Ext.Msg.OK,
        icon: Ext.MessageBox.ERROR
    });
};

Testopia.Util.getSelectedObjects = function(grid, field){
    var selections = grid.getSelectionModel().getSelections();
    var arIDs = [];
    var ids;
    for (var i = 0; i < selections.length; i++) {
        arIDs.push(selections[i].get(field));
    }
    ids = arIDs.join(',');
    return ids;
};

Testopia.Util.editFirstSelection = function(grid){
    if (grid.store.getCount() === 0) {
        return;
    }
    var row = grid.store.indexOf(grid.getSelectionModel().getSelected());
    if (row == -1){
        row = 0;
    }
    grid.plugins[0].startEditing(row);
};

Testopia.Util.urlQueryToJSON = function(url){
    url = url.replace(/.*\//, '');
    var params = {};
    var loc = url.split('?', 2);
    var file = loc[0];
    var search = loc[1] ? loc[1] : file;
    var pairs = search.split('&');
    
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        if (params[pair[0]]) {
            if (typeof params[pair[0]] == 'object') {
                params[pair[0]].push(unescape(pair[1]));
            }
            else {
                params[pair[0]] = new Array(params[pair[0]]);
                params[pair[0]].push(unescape(pair[1]));
            }
        }
        else {
            params[pair[0]] = unescape(pair[1]);
        }
    }
    
    return params;
};

Testopia.Util.JSONToURLQuery = function(params, searchStr, drops){
    searchStr = searchStr || '';
    for (var key in params) {
        if (drops.indexOf(key) != -1) {
            continue;
        }
        if (typeof params[key] == 'object') {
            for (i = 0; i < params[key].length; i++) {
                searchStr = searchStr + key + '=' + encodeURIComponent(params[key][i]) + '&';
            }
        }
        else {
            searchStr = searchStr + key + '=' + encodeURIComponent(params[key]) + '&';
        }
    }
    if (searchStr.lastIndexOf('&') == searchStr.length - 1) {
        searchStr = searchStr.substr(0, searchStr.length - 1);
    }
    return searchStr;
};
/*
 * Testopia.notify - Displays a floating notification area.
 * Taken from ext/examples/examples.js
 */
Testopia.Util.notify = function(){
    var msgCt;
    
    function createBox(t, s){
        return ['<div class="msg">', '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>', '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>', t, '</h3>', s, '</div></div></div>', '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>', '</div>'].join('');
    }
    return {
        msg: function(title, format){
            if (!msgCt) {
                msgCt = Ext.DomHelper.insertFirst(document.getElementById('bugzilla-body'), {
                    id: 'msg-div'
                }, true);
            }
            msgCt.alignTo(document, 't-t');
            var s = String.format.apply(String, Array.prototype.slice.call(arguments, 1));
            var m = Ext.DomHelper.append(msgCt, {
                html: createBox(title, s)
            }, true);
            m.slideIn('t').pause(1).ghost("t", {
                remove: true
            });
        },
        
        init: function(){
            return;
        }
    };
}();

Testopia.Util.trim = function(input){
    input = input.replace(/^\s+/g, '');
    input = input.replace(/\s+$/g, '');
    return input;
};

Testopia.Util.PlanSelector = function(product_id, cfg){
    var single = cfg.action.match('case') ? false : true;
    var pg = new Testopia.TestPlan.Grid({
        product_id: product_id
    }, {
        id: 'plan_selector_grid',
        height: 300,
        single: single
    });
    
    var pchooser = new Testopia.Product.Combo({
        mode: 'local',
        value: product_id
    });
    pchooser.on('select', function(c, r, i){
        pg.store.baseParams = {
            ctype: 'json',
            product_id: r.get('id')
        };
        pg.store.load();
    });
    
    Testopia.Util.PlanSelector.superclass.constructor.call(this, {
        items: [pg],
        buttons: [{
            text: 'Use Selected',
            handler: function(){
                var loc = cfg.action + '?plan_id=' + Testopia.Util.getSelectedObjects(pg, 'plan_id');
                if (cfg.bug_id) {
                    loc = loc + '&bug=' + cfg.bug_id;
                }
                window.location = loc;
            }
        }]
    });
    
    pg.on('render', function(){
        var items = pg.getTopToolbar().items.items;
        for (var i = 0; i < items.length; i++) {
            items[i].destroy();
        }
        pg.getTopToolbar().add('Product: ', pchooser);
        pg.getSelectionModel().un('rowselect', pg.getSelectionModel().events['rowselect'].listeners[0].fn);
        pg.getSelectionModel().un('rowdeselect', pg.getSelectionModel().events['rowdeselect'].listeners[0].fn);
        pg.store.load();
    });
}
Ext.extend(Testopia.Util.PlanSelector, Ext.Panel);

Testopia.Util.DisableTools = function(tbar, ex){
    if (typeof ex != 'object'){
        ex = [];
    }
    for (var i in tbar.items.items) {
        if (ex.indexOf(tbar.items.items[i].id) != -1) {
            continue;
        }
        try {
            tbar.items.items[i].disable();
        }
        catch (e) {
            
        }
    }
}

/*
 * END OF FILE - /bnc/extensions/testopia/js/util.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/attachments.js
 */
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

Testopia.Attachment.Grid = function(object){
    function attachlink(id){
        return '<a href="tr_attachment.cgi?attach_id=' + id + '">' + id + '</a>';
    }
    this.object = object;
    this.store = new Ext.data.JsonStore({
        url: 'tr_attachment.cgi',
        root: 'attachment',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            ctype: 'json',
            action: 'list',
            object: this.object.type,
            object_id: this.object.id
        },
        id: 'attach_id',
        fields: [{
            name: "attach_id",
            mapping: "attachment_id"
        }, {
            name: "submitter",
            mapping: "submitter"
        }, {
            name: "caserun_id",
            mapping: "caserun_id"
        }, {
            name: "filename",
            mapping: "filename"
        }, //editable
        {
            name: "timestamp",
            mapping: "creation_ts"
        }, {
            name: "mimetype",
            mapping: "mime_type"
        }, //editable
        {
            name: "description",
            mapping: "description"
        }, //editable
        {
            name: "isviewable",
            mapping: "isviewable"
        }, {
            name: "canedit",
            mapping: "canedit"
        }, {
            name: "candelete",
            mapping: "candelete"
        }, {
            name: "size",
            mapping: "datasize"
        }]
    });
    var ds = this.store;
    this.columns = [{
        id: 'attach_id',
        header: "ID",
        width: 20,
        sortable: true,
        dataIndex: 'attach_id',
        renderer: attachlink
    }, {
        header: "Created",
        width: 50,
        sortable: true,
        dataIndex: 'timestamp',
        renderer: function(v, md, r){
            if (r.get('caserun_id') && Ext.getCmp('caserun_grid') && Ext.getCmp('caserun_grid').getSelectionModel().getSelected().get('caserun_id') == r.get('caserun_id')) {
                return '<b>* ' + v + '</b>';
            }
            else {
                return v;
            }
        }
    }, {
        header: "Name",
        width: 50,
        editor: {
            xtype: 'textfield'
        },
        sortable: true,
        dataIndex: 'name'
    }, {
        header: "Submitted by",
        width: 50,
        sortable: true,
        dataIndex: 'submitter'
    }, {
        header: "Type",
        width: 30,
        editor: {
            xtype: 'textfield'
        },
        sortable: true,
        dataIndex: 'mimetype'
    }, {
        header: "Description",
        width: 120,
        editor: {
            xtype: 'textfield',
            value: 'description'
        },
        sortable: true,
        dataIndex: 'description'
    }, {
        header: "Size",
        width: 50,
        sortable: true,
        dataIndex: 'size',
        renderer: function(v){
            if (v) 
                return v + ' Bytes';
        }
    }];
    
    this.form = new Ext.form.BasicForm('testopia_helper_frm', {});
    Testopia.Attachment.Grid.superclass.constructor.call(this, {
        title: 'Attachments',
        id: 'attachments_panel',
        loadMask: {
            msg: 'Loading attachments...'
        },
        autoExpandColumn: "Name",
        autoScroll: true,
        plugins: [new Ext.ux.grid.RowEditor({
            id:'attachment_row_editor',
            saveText: 'Update'
        })],
        enableColumnHide: true,
        tbar: ['->', {
            xtype: 'button',
            id: 'edit_attachment_btn',
            icon: 'extensions/testopia/img/edit.png',
            iconCls: 'img_button_16x',
            disabled: true,
            tooltip: 'Edit Attachments',
            handler: function(){
                Testopia.Util.editFirstSelection(Ext.getCmp('attachments_panel'));
            }
        }, {
            xtype: 'button',
            id: 'add_attachment_btn',
            icon: 'extensions/testopia/img/add.png',
            iconCls: 'img_button_16x',
            tooltip: 'Attach a new file',
            handler: this.newAttachment.createDelegate(this)
        }, {
            xtype: 'button',
            id: 'delete_attachment_btn',
            icon: 'extensions/testopia/img/delete.png',
            iconCls: 'img_button_16x',
            disabled: true,
            tooltip: 'Remove selected attachments',
            handler: this.deleteAttachment.createDelegate(this)
        }],
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false,
            listeners: {
                'rowselect': function(sm, i, r){
                    if (r.get('candelete')) {
                        Ext.getCmp('delete_attachment_btn').enable();
                    }
                    if (r.get('canedit')) {
                        Ext.getCmp('edit_attachment_btn').enable();
                    }
                },
                'rowdeselect': function(sm, i, r){
                    if (sm.getCount() < 1) {
                        Ext.getCmp('delete_attachment_btn').disable();
                        Ext.getCmp('edit_attachment_btn').disable();
                    }
                }
            }
        }),
        viewConfig: {
            forceFit: true
        }
    });
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
    Ext.getCmp('attachment_row_editor').on('afteredit', this.onGridEdit, this);
};

Ext.extend(Testopia.Attachment.Grid, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        var sm = this.selectionModel;
        var object = this.object;
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'AttachGrid-ctx-menu',
                enableScrolling: false,
                items: [{
                    text: "Delete Selected Attachments",
                    id: 'attach_delete_mnu',
                    icon: 'extensions/testopia/img/delete.png',
                    iconCls: 'img_button_16x',
                    disabled: true,
                    handler: this.deleteAttachment.createDelegate(this)
                }, {
                    text: 'Reload List',
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
        if (grid.getSelectionModel().getSelected().get('candelete')) {
            Ext.getCmp('attach_delete_mnu').enable();
        }
        else {
            Ext.getCmp('attach_delete_mnu').enable();
        }
        this.menu.showAt(e.getXY());
    },
    onGridEdit: function(e){
        var myparams = e.record.data;
        var ds = this.store;
        myparams.ctype = 'json';
        myparams.action = 'edit';
        this.form.submit({
            url: "tr_attachment.cgi",
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
    newAttachment: function(){
        var form = new Testopia.Attachment.NewAttachmentPopup(this.object);
        form.window.show();
    },
    deleteAttachment: function(){
        object = this.object;
        Ext.Msg.show({
            title: 'Confirm Delete?',
            msg: ATTACHMENT_DELETE_WARNING,
            buttons: Ext.Msg.YESNO,
            fn: function(btn){
                if (btn == 'yes') {
                    var testopia_form = new Ext.form.BasicForm('testopia_helper_frm');
                    testopia_form.submit({
                        url: 'tr_attachment.cgi',
                        params: {
                            attach_ids: Testopia.Util.getSelectedObjects(Ext.getCmp('attachments_panel'), 'attach_id'),
                            action: 'remove',
                            ctype: 'json',
                            object: object.type,
                            object_id: object.id
                        },
                        success: function(){
                            Ext.getCmp('attachments_panel').store.load();
                        },
                        failure: Testopia.Util.error
                    });
                }
            },
            animEl: 'delete_attachment_btn',
            icon: Ext.MessageBox.QUESTION
        });
    },
    onActivate: function(event){
        if (this.object.type == 'caserun') {
            this.store.baseParams = {
                ctype: 'json',
                action: 'list',
                object: 'caserun',
                object_id: Ext.getCmp('caserun_grid').getSelectionModel().getSelected().get('caserun_id')
            };
            this.store.load();
        }
        if (!this.store.getCount()) {
            this.store.load();
        }
    }
});

Testopia.Attachment.Form = function(){
    var filecount = 1;
    Testopia.Attachment.Form.superclass.constructor.call(this, {
        title: "Attachments",
        id: 'attachments_form',
        autoScroll: true,
        items: [{
            layout: 'column',
            items: [{
                columnWidth: 0.5,
                layout: 'form',
                bodyStyle: 'padding: 5px 5px 10px 10px',
                id: 'attach_file_col',
                items: [{
                    xtype: 'field',
                    fieldLabel: 'Attachment',
                    inputType: 'file',
                    name: 'file1',
                    width: 300
                }]
            }, {
                columnWidth: 0.5,
                id: 'attach_desc_col',
                bodyStyle: 'padding: 5px 5px 10px 10px',
                layout: 'form',
                items: [{
                    xtype: 'textfield',
                    fieldLabel: 'Description',
                    name: 'file_desc1',
                    width: 300
                }]
            }]
        }],
        
        buttons: [{
            text: 'Attach Another',
            handler: function(){
                filecount++;
                if (filecount > 4) {
                    Ext.Msg.show({
                        msg: 'You may only attach 4 files at a time',
                        title: 'Limit Exceeded',
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.WARNING
                    });
                    return;
                }
                Ext.getCmp('attach_file_col').add(new Ext.form.Field({
                    fieldLabel: 'Attachment',
                    inputType: 'file',
                    name: 'file' + filecount,
                    width: 300
                }));
                Ext.getCmp('attach_desc_col').add(new Ext.form.Field({
                    fieldLabel: 'Description',
                    name: 'file_desc' + filecount,
                    width: 300
                }));
                Ext.getCmp('attachments_form').doLayout();
            }
        }]
    });
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.Attachment.Form, Ext.Panel, {
    onActivate: function(){
        Ext.getCmp('attachments_form').doLayout();
    }
});

Testopia.Attachment.NewAttachmentPopup = function(object){
    if (!this.window) {
        var win = new Ext.Window({
            id: 'new_attachment_win',
            title: 'Attach a file',
            closable: true,
            width: 400,
            height: 180,
            plain: true,
            shadow: false,
            closable: false,
            layout: 'fit',
            items: [{
                xtype: 'form',
                id: 'new_attach_frm',
                fileUpload: true,
                bodyStyle: 'padding: 10px',
                items: [{
                    xtype: 'textfield',
                    id: 'attach_desc',
                    fieldLabel: 'Description',
                    name: 'description',
                    allowBlank: false
                }, {
                    xtype: 'field',
                    id: 'attach_file',
                    inputType: 'file',
                    fieldLabel: 'File',
                    name: 'data',
                    allowBlank: false
                }]
            }],
            buttons: [{
                text: 'Submit',
                handler: function(){
                    Ext.getCmp('new_attach_frm').getForm().submit({
                        url: 'tr_attachment.cgi',
                        params: {
                            action: 'add',
                            object: object.type,
                            object_id: object.id,
                            ctype: 'json'
                        },
                        success: function(){
                            Ext.getCmp('attachments_panel').store.load();
                            Ext.getCmp('new_attachment_win').close();
                        },
                        failure: Testopia.Util.error
                    });
                }
            }, {
                text: 'Cancel',
                handler: function(){
                    Ext.getCmp('new_attachment_win').close();
                }
            }]
        });
        this.window = win;
    }
    return this;
};

/*
 * END OF FILE - /bnc/extensions/testopia/js/attachments.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/plan.js
 */
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
    newRun: function(a,b,c,d){
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        var p = {plan_id: Testopia.Util.getSelectedObjects(this, 'plan_id'), action: 'check_plan_rights'};
        var records = this.getSelectionModel().getSelected();
        form.submit({
            url: 'tr_quicksearch.cgi',
            params: p,
            success: function(f,a){
                Testopia.TestRun.NewRunPopup(records);
            },
            failure: function(f, a){
                Testopia.Util.error(f, a);
            }
        });
    },
    newCase: function(){
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        var p = {plan_id: Testopia.Util.getSelectedObjects(this, 'plan_id'), action: 'check_plan_rights'};
        var records = this.getSelectionModel().getSelected();
        var prod = this.getSelectionModel().getSelected().get('product_id'); 
        form.submit({
            url: 'tr_quicksearch.cgi',
            params: p,
            success: function(f,a){
                Testopia.TestCase.NewCasePopup(records, prod);
            },
            failure: function(f, a){
                Testopia.Util.error(f, a);
            }
        });
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

/*
 * END OF FILE - /bnc/extensions/testopia/js/plan.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/case.js
 */
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
                                    var httpRequest = new Ext.data.Connection();
                                    httpRequest.request({
                                        url: 'tr_quicksearch.cgi',
                                        params: {
                                            action: 'get_action',
                                            bug_id: Ext.urlDecode(location.search.substring(1)).bug
                                        },
                                        success: function(d){
                                            h.setValue(d.responseText);
                                        },
                                        failure: Testopia.Util.error
                                    });
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
                                    var httpRequest = new Ext.data.Connection();
                                    httpRequest.request({
                                        url: 'tr_quicksearch.cgi',
                                        params: {
                                            action: 'get_effect',
                                            bug_id: Ext.urlDecode(location.search.substring(1)).bug
                                        },
                                        success: function(d){
                                            h.setValue(d.responseText);
                                        },
                                        failure: Testopia.Util.error
                                    });
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
                var form = Ext.getCmp('case_clone_frm').getForm();
                var params = form.getValues();
                form.baseParams = {};
                form.baseParams.action = 'clone';
                form.baseParams.ids = cases;
                form.baseParams.plan_ids = Testopia.Util.getSelectedObjects(Ext.getCmp('plan_clone_grid'), 'plan_id');
                form.baseParams.product_id = Ext.getCmp('case_clone_win_product_chooser').getValue();
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

/*
 * END OF FILE - /bnc/extensions/testopia/js/case.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/caserun.js
 */
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
            var url = 'enter_bug.cgi?';
            for (var i = 0; i < store.fields.keys.length; i++) {
                url = url + store.fields.keys[i] + '=' + escape(store.getAt(0).get(store.fields.keys[i])) + '&';
            }
            url = url + 'caserun_id=' + caserun_id;
            window.open(url);
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

/*
 * END OF FILE - /bnc/extensions/testopia/js/caserun.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/run.js
 */
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

/*
 * END OF FILE - /bnc/extensions/testopia/js/run.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/build.js
 */
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

Testopia.Build.Store = function(params, auto){
    params.action = 'list';
    Testopia.Build.Store.superclass.constructor.call(this, {
        url: 'tr_builds.cgi',
        root: 'builds',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: params,
        id: 'build_id',
        autoLoad: auto,
        fields: [{
            name: "build_id",
            mapping: "build_id"
        }, {
            name: "name",
            mapping: "name"
        }, {
            name: "milestone",
            mapping: "milestone"
        }, {
            name: "description",
            mapping: "description"
        }, {
            name: "product_id",
            mapping: "product_id"
        }, {
            name: "isactive",
            mapping: "isactive"
        }]
    });
};

Ext.extend(Testopia.Build.Store, Ext.data.JsonStore);

/*
 * Testopia.Build.Combo
 */
Testopia.Build.Combo = function(cfg){
    Testopia.Build.Combo.superclass.constructor.call(this, {
        id: cfg.id || 'build_combo',
        store: cfg.transform ? false : new Testopia.Build.Store(cfg.params, cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up builds...',
        displayField: 'name',
        valueField: 'build_id',
        typeAhead: true,
        triggerAction: 'all',
        minListWidth: 300,
        forceSelection: true,
        transform: cfg.transform,
        emptyText: 'Builds...'
    });
    Ext.apply(this, cfg);
    this.store.on('load', function(){
        if (cfg.value) {
            this.setValue(cfg.value);
        }
    }, this);
};
Ext.extend(Testopia.Build.Combo, Ext.form.ComboBox);

Testopia.Build.Grid = function(product_id){
    this.product_id = product_id;
    this.store = new Testopia.Build.Store({}, false);
    var mbox = new Testopia.Product.MilestoneCombo({
        hiddenField: 'milestone',
        mode: 'remote',
        params: {
            product_id: product_id
        },
        listeners: {
            'startedit': function(){
                var pid = Ext.getCmp('products_pane').getSelectionModel().getSelectedNode().id;
                if (mbox.store.baseParams.product_id != pid) {
                    mbox.store.baseParams.product_id = pid;
                    mbox.store.load();
                }
            }
        }
    });
    this.columns = [{
        header: "Name",
        width: 80,
        sortable: true,
        dataIndex: 'name',
        editor: {
            xtype: 'textfield',
            value: 'name',
            allowBlank: false
        }
    }, {
        header: "Description",
        width: 120,
        editor: {
            xtype: 'textfield'
        },
        sortable: true,
        dataIndex: 'description'
    }, {
        header: "Milestone",
        width: 120,
        sortable: true,
        dataIndex: 'milestone',
        editor: mbox
    }, {
        header: 'Active',
        dataIndex: 'isactive',
        trueText: 'Yes',
        falseText: 'No',
        sortable: true,
        xtype: 'booleancolumn',
        editor:{
            xtype: 'checkbox',
            value: 'isactive'
        },
        width: 25
    }];
    
    this.form = new Ext.form.BasicForm('testopia_helper_frm');
    
    Testopia.Build.Grid.superclass.constructor.call(this, {
        title: 'Builds',
        id: 'build_grid',
        loadMask: {
            msg: 'Loading Builds...'
        },
        autoExpandColumn: "build_name",
        autoScroll: true,
        plugins: [new Ext.ux.grid.RowEditor({
            id:'build_row_editor',
            saveText: 'Update'
        })],
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: true
        }),
        viewConfig: {
            forceFit: true
        },
        tbar: [new Ext.Toolbar.Fill(), {
            xtype: 'button',
            id: 'edit_build_btn',
            icon: 'extensions/testopia/img/edit.png',
            iconCls: 'img_button_16x',
            tooltip: 'Edit Selected Build',
            handler: function(){
                Testopia.Util.editFirstSelection(Ext.getCmp('build_grid'));
            }
        }, {
            xtype: 'button',
            id: 'add_build_btn',
            icon: 'extensions/testopia/img/add.png',
            iconCls: 'img_button_16x',
            tooltip: 'Add a new Build',
            handler: this.newRecord
        }]
    });
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
    Ext.getCmp('build_row_editor').on('afteredit', this.onGridEdit, this);
};
Ext.extend(Testopia.Build.Grid, Ext.grid.GridPanel, {
    newRecord: function(){
        NewBuild = Ext.data.Record.create([{
            name: 'name',
            type: 'string'
        }, {
            name: 'milestone'
        }, {
            name: 'description',
            type: 'string'
        }, {
            name: 'isactive',
            type: 'bool'
        }]);
        var b = new NewBuild({
            name: '',
            milestone: Ext.getCmp('products_pane').getSelectionModel().getSelectedNode().attributes.attributes.defaultmilestone,
            description: '',
            isactive: true
        });
        var g = Ext.getCmp('build_grid');
        g.store.insert(0, b);
        Ext.getCmp('build_row_editor').startEditing(0);
    },
    onContextClick: function(grid, index, e){
        grid.getSelectionModel().selectRow(index);
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'build-ctx-menu',
                enableScrolling: false,
                items: [{
                    text: "Reports",
                    enableScrolling: false,
                    menu: {
                        items: [{
                            text: 'New Completion Report',
                            handler: function(){
                                Ext.getCmp('object_panel').setActiveTab('dashboardpanel');
                                
                                var newPortlet = new Ext.ux.Portlet({
                                    title: 'Build Completion Report',
                                    closable: true,
                                    autoScroll: true,
                                    tools: PortalTools
                                });
                                newPortlet.url = 'tr_builds.cgi?action=report&product_id=' + grid.product_id + '&build_ids=' + Testopia.Util.getSelectedObjects(grid, 'id');
                                Testopia.Search.dashboard_urls.push(newPortlet.url);
                                Ext.getCmp('dashboard_leftcol').add(newPortlet);
                                Ext.getCmp('dashboard_leftcol').doLayout();
                                newPortlet.load({
                                    url: newPortlet.url
                                });
                            }
                        }]
                    }
                }, {
                    text: 'Add a Build',
                    icon: 'extensions/testopia/img/add.png',
                    iconCls: 'img_button_16x',
                    handler: this.newRecord
                }, {
                    text: 'Edit This Build',
                    icon: 'extensions/testopia/img/edit.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        Testopia.Util.editFirstSelection(grid);
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
        e.stopEvent();
        this.menu.showAt(e.getXY());
    },
    onGridEdit: function(e){
        var myparams = e.record.data;
        var ds = this.store;
        myparams.product_id = this.product_id;
        if (myparams.build_id) {
            myparams.action = "edit";
        }
        else {
            myparams.action = "add";
        }
        this.form.submit({
            url: "tr_builds.cgi",
            params: myparams,
            success: function(f, a){
                if (a.result.build_id) {
                    e.record.set('build_id', a.result.build_id);
                }
                ds.commitChanges();
            },
            failure: function(f, a){
                Testopia.Util.error(f, a);
                ds.rejectChanges();
            }
        });
    },
    onActivate: function(event){
        if (!this.product_id) {
            Ext.Msg.alert('Error', 'Please select a product.');
            Ext.getCmp('edit_build_btn').disable();
            Ext.getCmp('add_build_btn').disable();
            return;
        }
        else {
            if (!this.store.getCount()) {
                this.store.load({
                    params: {
                        product_id: this.product_id
                    }
                });
            }
        }
    }
});

/*
 * END OF FILE - /bnc/extensions/testopia/js/build.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/category.js
 */
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
Testopia.Category.Store = function(params, auto){
    params.action = 'list';
    Testopia.Category.Store.superclass.constructor.call(this, {
        url: 'tr_categories.cgi',
        root: 'categories',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: params,
        id: 'category_id',
        autoLoad: auto,
        fields: [{
            name: "category_id",
            mapping: "category_id"
        }, {
            name: "name",
            mapping: "name"
        }, {
            name: "description",
            mapping: "description"
        }]
    });
};
Ext.extend(Testopia.Category.Store, Ext.data.JsonStore);

/*
 * Testopia.Category.Combo
 */
Testopia.Category.Combo = function(cfg){
    Testopia.Category.Combo.superclass.constructor.call(this, {
        id: cfg.id || 'case_category_combo',
        store: cfg.transform ? false : new Testopia.Category.Store(cfg.params, cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up categories...',
        displayField: 'name',
        valueField: 'category_id',
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
Ext.extend(Testopia.Category.Combo, Ext.form.ComboBox);

Testopia.Category.Grid = function(product_id){
    this.product_id = product_id;
    this.store = new Testopia.Category.Store({}, false);
    var ds = this.store;
    this.columns = [{
        header: "Name",
        width: 120,
        sortable: true,
        dataIndex: 'name',
        editor: {
            xtype: 'textfield',
            value: 'name',
            allowBlank: false
        } 
    }, {
        header: "Description",
        width: 120,
        id: 'category_desc_column',
        editor: {
            xtype: 'textfield',
            value: 'description'
        },
        sortable: true,
        dataIndex: 'description'
    }];
    
    this.form = new Ext.form.BasicForm('testopia_helper_frm', {});
    
    Testopia.Category.Grid.superclass.constructor.call(this, {
        title: 'Categories',
        id: 'category_grid',
        loadMask: {
            msg: 'Loading Categories...'
        },
        autoExpandColumn: "category_desc_column",
        autoScroll: true,
        plugins: [new Ext.ux.grid.RowEditor({
            id:'category_row_editor',
            saveText: 'Update'
        })],
        enableColumnHide: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: true
        }),
        viewConfig: {
            forceFit: true
        },
        tbar: [new Ext.Toolbar.Fill(), {
            xtype: 'button',
            id: 'edit_category_btn',
            icon: 'extensions/testopia/img/edit.png',
            iconCls: 'img_button_16x',
            tooltip: 'Edit Selected Category',
            handler: function(){
                Testopia.Util.editFirstSelection(Ext.getCmp('category_grid'));
            }
        }, {
            xtype: 'button',
            id: 'add_category_btn',
            icon: 'extensions/testopia/img/add.png',
            iconCls: 'img_button_16x',
            tooltip: 'Add a new Category',
            handler: this.newRecord
        }, {
            xtype: 'button',
            icon: 'extensions/testopia/img/delete.png',
            iconCls: 'img_button_16x',
            tooltip: 'Delete this Category',
            handler: function(){
                var m = Ext.getCmp('category_grid').getSelectionModel().getSelected();
                if (!m) {
                    Ext.MessageBox.alert('Message', 'Please select at least one Category to delete');
                }
                else {
                    Testopia.Category.remove(product_id);
                }
            }
        }]
    });
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
    Ext.getCmp('category_row_editor').on('afteredit', this.onGridEdit, this);
    
};
Ext.extend(Testopia.Category.Grid, Ext.grid.GridPanel, {
    newRecord: function(){
        NewCategory = Ext.data.Record.create([{
            name: 'name',
            type: 'string'
        }, {
            name: 'description',
            type: 'string'
        }]);
        var b = new NewCategory({
            name: '',
            description: ''
        });
        var g = Ext.getCmp('category_grid');
        g.store.insert(0, b);
        Ext.getCmp('category_row_editor').startEditing(0);
    },
    onContextClick: function(grid, index, e){
        grid.getSelectionModel().selectRow(index);
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'category-ctx-menu',
                enableScrolling: false,
                items: [{
                    text: 'Add a Category',
                    icon: 'extensions/testopia/img/add.png',
                    iconCls: 'img_button_16x',
                    handler: this.newRecord
                }, {
                    text: 'Edit This Category',
                    icon: 'extensions/testopia/img/edit.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        Testopia.Util.editFirstSelection(grid);
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
        e.stopEvent();
        this.menu.showAt(e.getXY());
    },
    onGridEdit: function(e){
        var myparams = e.record.data;
        var ds = this.store;
        myparams.product_id = this.product_id;
        if (myparams.category_id) {
            myparams.action = "edit";
        }
        else {
            myparams.action = "add";
        }
        this.form.submit({
            url: "tr_categories.cgi",
            params: myparams,
            success: function(f, a){
                if (a.result.category_id) {
                    e.record.set('category_id', a.result.category_id);
                }
                ds.commitChanges();
            },
            failure: function(f, a){
                Testopia.Util.error(f, a);
                ds.rejectChanges();
            }
        });
        
    },
    onActivate: function(event){
        if (!this.product_id) {
            Ext.Msg.alert('Error', 'Please select a product.');
            Ext.getCmp('edit_category_btn').disable();
            Ext.getCmp('add_category_btn').disable();
            return;
        }
        else {
            if (!this.store.getCount()) {
                this.store.load({
                    params: {
                        product_id: this.product_id
                    }
                });
            }
        }
    }
});

Testopia.Category.remove = function(){
    if (!Ext.getCmp('category_grid').getSelectionModel().getSelected().get('category_id')) {
        Ext.getCmp('category_grid').store.reload();
        return;
    }
    Ext.Msg.show({
        title: 'Confirm Delete?',
        msg: CASE_CATEGORY_DELETE_WARNING,
        buttons: Ext.Msg.YESNO,
        animEl: 'casecategory-delete-btn',
        icon: Ext.MessageBox.QUESTION,
        fn: function(btn){
            if (btn == 'yes') {
                var testopia_form = new Ext.form.BasicForm('testopia_helper_frm');
                testopia_form.submit({
                    url: 'tr_categories.cgi',
                    params: {
                        category_id: Ext.getCmp('category_grid').getSelectionModel().getSelected().get('category_id'),
                        action: 'delete',
                        product_id: Ext.getCmp('category_grid').product_id
                    },
                    success: function(data){
                        Ext.Msg.show({
                            msg: "Test case category deleted",
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.INFO
                        });
                        Ext.getCmp('category_grid').store.reload();
                    },
                    failure: Testopia.Util.error
                });
            }
        }
    });
};


/*
 * END OF FILE - /bnc/extensions/testopia/js/category.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/diff-tabs.js
 */
Ext.ux.TabCloseMenu = function(){
    var tabs, menu, ctxItem;
    this.init = function(tp){
        tabs = tp;
        tabs.on('contextmenu', onContextMenu);
    }

    function onContextMenu(ts, item, e){
        if(!menu){ // create context menu on first right click
            menu = new Ext.menu.Menu([{
                id: tabs.id + '-close',
                text: 'Close Tab',
                handler : function(){
                    tabs.remove(ctxItem);
                }
            },{
                id: tabs.id + '-close-others',
                text: 'Close Other Tabs',
                handler : function(){
                    tabs.items.each(function(item){
                        if(item.closable && item != ctxItem){
                            tabs.remove(item);
                        }
                    });
                }
            }]);
        }
        ctxItem = item;
        var items = menu.items;
        items.get(tabs.id + '-close').setDisabled(!item.closable);
        var disableOthers = true;
        tabs.items.each(function(){
            if(this != item && this.closable){
                disableOthers = false;
                return false;
            }
        });
        items.get(tabs.id + '-close-others').setDisabled(disableOthers);
        menu.showAt(e.getPoint());
    }
};

diff_tab_panel = function(type, id, doctype){
    var self = this;

    var doc_store = new Ext.data.JsonStore({
        url: "tr_history.cgi",
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {action: 'getversions',
                     type:   type,
                     id:     id},
        root: 'versions',
        fields: [
            {name: 'name', mapping: 'name',
             name: 'id', mapping: 'id'}
        ]
    })

    
    diff_tab_panel.superclass.constructor.call(this, {
        title:  'Test Panel',
        height: 500,
        resizeTabs:true, // turn on tab resizing
        minTabWidth: 115,
        tabWidth:135,
        enableTabScroll:true,
        defaults: {autoScroll:true},
        plugins: new Ext.ux.TabCloseMenu(),
        activeTab: 0,
        tbar: [  
                  new Ext.form.ComboBox({
                                            displayField: 'name',
                                          valueField: 'id',
                                          name: 'product',
                                          id: 'product_combo',
                                          fieldLabel: "Product",
                                          store: doc_store,
                                          emptyText: 'Select a version...',
                                          width: 200
                                       }),
                  " Right: ",
                  new Ext.Toolbar.Spacer(),                       
                  new Ext.form.ComboBox({
                  }),
                  " HTML: ",
                  new Ext.form.Radio({
                                        id:    'format',
                                      value: 'html',
                                      checked: true
                                    }),
                  " Raw: ",
                  new Ext.form.Radio({
                                        id:    'format',
                                      value: 'raw'
                                     }),                                   
                  new Ext.Button({
                                  text:    'Diff',
                                  handler: addTab
                                }),
                  new Ext.Toolbar.Separator(),                             
                  "Show Version: ",
                  new Ext.form.ComboBox({
                                       }),                             
                  new Ext.Button({
                                  text:    'Show',
                                  handler: addTab
                                })
              ]
    });
    
    
    function addTab() {
        self.add({
            title:   'New Tab ',
            iconCls: 'tabs',
            html:    'diff_text',
            closable:true
        }).show();
    }                                  

}

Ext.extend(diff_tab_panel, Ext.TabPanel);


/*
 * END OF FILE - /bnc/extensions/testopia/js/diff-tabs.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/environment.js
 */
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
Testopia.Environment.Store = function(params, auto){
    params.ctype = 'json';
    Testopia.Environment.Store.superclass.constructor.call(this, {
        url: 'tr_list_environments.cgi',
        listeners: {
            'exception': Testopia.Util.loadError
        },
        root: 'Result',
        baseParams: params,
        totalProperty: 'totalResultsAvailable',
        autoLoad: auto,
        id: 'environment_id',
        fields: [{
            name: "environment_id",
            mapping: "environment_id"
        }, {
            name: "name",
            mapping: "name"
        }, {
            name: "run_count",
            mapping: "run_count"
        }, {
            name: "isactive",
            mapping: "isactive"
        }, {
            name: "product",
            mapping: "product_name"
        }],
        remoteSort: true
    });
    this.paramNames.sort = "order";
};
Ext.extend(Testopia.Environment.Store, Ext.data.JsonStore);

/*
 * Testopia.Environment.Combo
 */
Testopia.Environment.Combo = function(cfg){
    if (cfg.params) {
        cfg.params.viewall = 1;
    }
    Testopia.Environment.Combo.superclass.constructor.call(this, {
        id: cfg.id || 'environment_combo',
        store: cfg.transform ? false : new Testopia.Environment.Store(cfg.params, cfg.mode == 'local' ? true : false),
        loadingText: 'Looking up environments...',
        displayField: 'name',
        valueField: 'environment_id',
        typeAhead: true,
        triggerAction: 'all',
        minListWidth: 300,
        forceSelection: true,
        transform: cfg.transform,
        emptyText: 'Environments...'
    });
    Ext.apply(this, cfg);
    this.store.on('load', function(){
        if (cfg.value) {
            this.setValue(cfg.value);
        }
    }, this);
};
Ext.extend(Testopia.Environment.Combo, Ext.form.ComboBox);

Testopia.Environment.Grid = function(params, cfg){
    this.params = params;
    this.product_id = params.product_id;
    function environmentLink(id){
        return '<a href="tr_environments.cgi?env_id=' + id + '">' + id + '</a>';
    }
    function productLink(id){
        return '<a href="tr_show_product.cgi?product_id=' + id + '">' + id + '</a>';
    }
    
    this.store = new Testopia.Environment.Store(params, false);
    var ds = this.store;
    
    this.columns = [{
        header: "ID",
        width: 30,
        dataIndex: "environment_id",
        sortable: true,
        renderer: environmentLink,
        hideable: false
    }, {
        header: "Environment Name",
        width: 110,
        dataIndex: "name",
        id: 'env_name_col',
        sortable: true,
        editor: new Ext.grid.GridEditor(new Ext.form.TextField({
            allowBlank: false
        }), {
            id: 'env_name_edt'
        })
    }, {
        header: "Product Name",
        width: 150,
        dataIndex: "product",
        sortable: true,
        hidden: true
    }, {
        header: "Run Count",
        width: 30,
        dataIndex: "run_count",
        sortable: false
    }, new Ext.grid.CheckColumn({
        sortable: true,
        header: 'Active',
        dataIndex: 'isactive',
        editor: new Ext.grid.GridEditor(new Ext.form.Checkbox({
            value: 'isactive'
        })),
        width: 25
    })];
    this.form = new Ext.form.BasicForm('testopia_helper_frm', {});
    this.bbar = new Testopia.Util.PagingBar('environment', this.store);
    Testopia.Environment.Grid.superclass.constructor.call(this, {
        title: 'Environments',
        id: 'environment-grid',
        loadMask: {
            msg: 'Loading Environments...'
        },
        autoExpandColumn: "env_name_col",
        autoScroll: true,
        plugins: [new Ext.ux.grid.RowEditor({
            saveText: 'Update'
        })],
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: true,
            listeners: {
                'rowselect': function(sm, i, r){
                    Ext.getCmp('delete_env_list_btn').enable();
                    Ext.getCmp('clone_env_list_btn').enable();
                },
                'rowdeselect': function(sm, i, r){
                    if (sm.getCount() < 1) {
                        Ext.getCmp('delete_env_list_btn').disable();
                        Ext.getCmp('clone_env_list_btn').disable();
                    }
                }
            }
        }),
        viewConfig: {
            forceFit: true
        },
        tbar: [{
            xtype: 'button',
            text: 'Import',
            handler: this.importEnv.createDelegate(this)
        }, new Ext.Toolbar.Fill(), {
            xtype: 'button',
            id: 'add_env_list_btn',
            icon: 'extensions/testopia/img/add.png',
            iconCls: 'img_button_16x',
            tooltip: 'Add an Environment',
            handler: this.createEnv.createDelegate(this, ['', 'add'])
        }, {
            xtype: 'button',
            id: 'clone_env_list_btn',
            disabled: true,
            icon: 'extensions/testopia/img/copy.png',
            iconCls: 'img_button_16x',
            tooltip: 'Clone this Environment',
            handler: this.cloneEnv.createDelegate(this)
        }, {
            xtype: 'button',
            id: 'delete_env_list_btn',
            disabled: true,
            icon: 'extensions/testopia/img/delete.png',
            iconCls: 'img_button_16x',
            tooltip: 'Delete this Environment',
            handler: this.deleteEnv.createDelegate(this)
        }]
    });
    Ext.apply(this, cfg);
    
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('afteredit', this.onGridEdit, this);
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.Environment.Grid, Ext.grid.EditorGridPanel, {
    onContextClick: function(grid, index, e){
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                enableScrolling: false,
                id: 'run-ctx-menu',
                items: [{
                    text: 'Create a new environment',
                    handler: function(){
                        window.location = "tr_new_environment.cgi";
                    }
                }, {
                    text: 'Delete Environments',
                    handler: this.deleteEnv.createDelegate(this)
                }, {
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
    onGridEdit: function(e){
        var myparams = {
            env_id: e.record.get('environment_id')
        };
        var ds = this.store;
        switch (e.field) {
            case 'name':
                myparams.action = 'rename';
                myparams.name = e.value;
                break;
            case 'isactive':
                myparams.action = 'toggle';
                break;
        }
        this.form.submit({
            url: "tr_environments.cgi",
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
    deleteEnv: function(){
        var grid = this;
        Ext.Msg.show({
            title: 'Confirm Delete?',
            msg: ENVIRONMENT_DELETE_WARNING,
            buttons: Ext.Msg.YESNO,
            animEl: 'case-delete-btn',
            icon: Ext.MessageBox.QUESTION,
            fn: function(btn){
                if (btn == 'yes') {
                    form = new Ext.form.BasicForm('testopia_helper_frm', {});
                    form.submit({
                        url: 'tr_environments.cgi',
                        params: {
                            env_id: grid.getSelectionModel().getSelected().get('environment_id'),
                            action: 'delete'
                        },
                        success: function(){
                            Ext.Msg.show({
                                msg: "Test environment deleted",
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
    createEnv: function(name, action, id){
        var grid = this;
        action = action || 'add';
        var win = new Ext.Window({
            id: 'create-env-win',
            title: 'Environment XML Import',
            closable: true,
            width: 400,
            height: 230,
            plain: true,
            shadow: false,
            layout: 'fit',
            items: [{
                xtype: 'form',
                url: 'tr_environments.cgi',
                bodyStyle: 'padding: 10px',
                id: 'env_create_frm',
                items: [{
                    xtype: 'field',
                    fieldLabel: 'Name',
                    inputType: 'text',
                    name: 'name',
                    value: name != '' ? 'Copy of ' + name : '',
                    allowBlank: false
                }, new Testopia.Product.Combo({
                    mode: 'local',
                    fieldLabel: 'Product',
                    value: grid.product_id,
                    hiddenName: 'product_id'
                }), {
                    xtype: 'hidden',
                    name: 'action',
                    value: action
                }, {
                    xtype: 'hidden',
                    name: 'env_id',
                    value: id
                }],
                buttons: [{
                    text: 'Create',
                    handler: function(){
                        Ext.getCmp('env_create_frm').getForm().submit({
                            success: function(form, data){
                                Ext.Msg.show({
                                    title: 'Test Environment Created',
                                    msg: 'Test environment ' + data.result.id + ' Created. Would you like to go there now?',
                                    buttons: Ext.Msg.YESNO,
                                    icon: Ext.MessageBox.QUESTION,
                                    fn: function(btn){
                                        if (btn == 'yes') {
                                            window.location = 'tr_environments.cgi?env_id=' + data.result.id;
                                        }
                                        else {
                                            grid.store.reload();
                                        }
                                    }
                                });
                                Ext.getCmp('create-env-win').close();
                            },
                            failure: Testopia.Util.error
                        });
                    }
                }, {
                    text: 'Cancel',
                    handler: function(){
                        Ext.getCmp('create-env-win').close();
                    }
                }]
            }]
        });
        win.show(this);
    },
    cloneEnv: function(){
        this.createEnv(this.getSelectionModel().getSelected().get('name'), 'clone', this.getSelectionModel().getSelected().get('environment_id'));
    },
    importEnv: function(){
        grid = this;
        var win = new Ext.Window({
            id: 'import-env-win',
            title: 'Environment XML Import',
            closable: true,
            width: 400,
            height: 130,
            plain: true,
            shadow: false,
            layout: 'fit',
            items: [{
                xtype: 'form',
                url: 'tr_import_environment.cgi',
                bodyStyle: 'padding: 10px',
                id: 'env_xml_import_frm',
                fileUpload: true,
                items: [{
                    xtype: 'field',
                    fieldLabel: 'XML',
                    inputType: 'file',
                    name: 'xml',
                    allowBlank: false
                }],
                buttons: [{
                    text: 'Import',
                    handler: function(){
                        Ext.getCmp('env_xml_import_frm').getForm().submit();
                        Ext.getCmp('import-env-win').close();
                        grid.store.reload();
                    }
                }, {
                    text: 'Cancel',
                    handler: function(){
                        Ext.getCmp('import-env-win').close();
                    }
                }]
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

/*
 * END OF FILE - /bnc/extensions/testopia/js/environment.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/product.js
 */
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

/*
 * END OF FILE - /bnc/extensions/testopia/js/product.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/search.js
 */
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
                    Ext.getCmp('object_panel').add(new Ext.Panel({
                        id: 'plan_search' + searchnum, 
                        closable: true,
                        title: 'Plan Report',
                        autoScroll: true,
                        listeners: { 'render': function(){
                            this.load({
                                url: 'tr_plan_reports.cgi',
                                params: values
                            });
                        }},
                        tbar:[new Ext.Toolbar.Fill(),
                        {
                            xtype: 'button',
                            id: 'save_plan_report_btn',
                            icon: 'extensions/testopia/img/save.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Save this report',
                            handler: function(b,e){
                                Testopia.Search.save('plan', values);
                            }
                        },{
                            xtype: 'button',
                            id: 'link_plan_report_btn',
                            icon: 'extensions/testopia/img/link.png',
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
                    Ext.getCmp('object_panel').add(new Ext.Panel({
                        id: 'case_search' + searchnum, 
                        closable: true,
                        title: 'Case Report',
                        autoScroll: true,
                        listeners: { 'render': function(){
                            this.load({
                                url: 'tr_case_reports.cgi',
                                params: values
                            });
                        }},
                        tbar:[new Ext.Toolbar.Fill(),
                        {
                            xtype: 'button',
                            id: 'save_case_report_btn',
                            icon: 'extensions/testopia/img/save.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Save this report',
                            handler: function(b,e){
                                Testopia.Search.save('case', values);
                            }
                        },{
                            xtype: 'button',
                            id: 'link_case_report_btn',
                            icon: 'extensions/testopia/img/link.png',
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
                            icon: 'extensions/testopia/img/save.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Save this report',
                            handler: function(b,e){
                                Testopia.Search.save('run', values);
                            }
                        },{
                            xtype: 'button',
                            id: 'link_run_report_btn',
                            icon: 'extensions/testopia/img/link.png',
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
                    Ext.getCmp('object_panel').add(new Ext.Panel({
                        id: 'case_run_search' + searchnum, 
                        closable: true,
                        title: 'Case-Run Report',
                        autoScroll: true,
                        listeners: { 'render': function(){
                            this.load({
                                url: 'tr_caserun_reports.cgi',
                                params: values
                            });
                        }},
                        tbar:[new Ext.Toolbar.Fill(),
                        {
                            xtype: 'button',
                            id: 'save_caserun_report_btn',
                            icon: 'extensions/testopia/img/save.png',
                            iconCls: 'img_button_16x',
                            tooltip: 'Save this report',
                            handler: function(b,e){
                                Testopia.Search.save('caserun', values);
                            }
                        },{
                            xtype: 'button',
                            id: 'link_plan_list_btn',
                            icon: 'extensions/testopia/img/link.png',
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
                icon: 'extensions/testopia/img/edit.png',
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
                icon: 'extensions/testopia/img/delete.png',
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
                icon: 'extensions/testopia/img/refresh.png',
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
                icon: 'extensions/testopia/img/link.png',
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
                icon: 'extensions/testopia/img/refresh.png',
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

/*
 * END OF FILE - /bnc/extensions/testopia/js/search.js
 */

/*
 * START OF FILE - /bnc/extensions/testopia/js/tags.js
 */
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

/*
 * Testopia.Tags.Lookup - This generates a typeahead lookup for Tagnames.
 * It can be used anywhere in Testopia. Extends Ext ComboBox
 */
Testopia.Tags.Lookup = function(cfg){
    Testopia.Tags.Lookup.superclass.constructor.call(this, {
        id: cfg.id || 'tag_lookup',
        store: new Ext.data.JsonStore({
            url: 'tr_quicksearch.cgi',
            listeners: { 'exception': Testopia.Util.loadError },
            baseParams: {
                action: 'gettag'
            },
            root: 'tags',
            totalProperty: 'total',
            fields: [{
                name: 'id',
                mapping: 'tag_id'
            }, {
                name: 'name',
                mapping: 'tag_name'
            }]
        }),
        queryParam: 'search',
        loadingText: 'Looking up tags...',
        displayField: 'name',
        valueField: 'id',
        typeAhead: false,
        hiddenName: 'tag',
        hideTrigger: true,
        minListWidth: 300,
        minChars: 2,
        width: 150,
        editable: true,
        forceSelection: false,
        emptyText: 'Type a tagname...',
        listeners: {
            'specialkey': function(f, e){
                if (e.getKey() == e.ENTER) {
                    Ext.getCmp('tag_add_btn').fireEvent('click');
                }
            }
        }
    });
    Ext.apply(this, cfg);
};
Ext.extend(Testopia.Tags.Lookup, Ext.form.ComboBox);

Testopia.Tags.renderer = function(v, md, r, ri, ci, s, type, pid){
    return '<div style="cursor:pointer" onclick=Testopia.Tags.list("' + type + '",' + pid + ',"' + r.get('tag_name') + '")>' + v + '</div>';
};

Testopia.Tags.list = function(type, product, tag){
    var cfg = {
        title: 'Tag Results: ' + tag,
        closable: true,
        id: tag + 'search' + product,
        autoScroll: true
    };
    var search = {
        product_id: product,
        tags: tag
    };
    
    var newTab
    if (type == 'case') {
        newTab = new Testopia.TestCase.Grid(search, cfg);
    }
    else 
        if (type == 'plan') {
            newTab = new Testopia.TestPlan.Grid(search, cfg);
        }
        else 
            if (type == 'run') {
                newTab = new Testopia.TestRun.Grid(search, cfg);
            }
    
    Ext.getCmp('object_panel').add(newTab);
    Ext.getCmp('object_panel').activate(tag + 'search' + product);
};

Testopia.Tags.ObjectTags = function(obj, obj_id){
    this.orig_id = obj_id;
    this.obj_id = obj_id;
    this.store = new Ext.data.JsonStore({
        url: 'tr_tags.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'gettags',
            type: obj
        },
        root: 'tags',
        id: 'tag_id',
        fields: [{
            name: 'tag_id',
            mapping: 'tag_id'
        }, {
            name: 'tag_name',
            mapping: 'tag_name'
        }, {
            name: 'run_count',
            mapping: 'run_count'
        }, {
            name: 'case_count',
            mapping: 'case_count'
        }, {
            name: 'plan_count',
            mapping: 'plan_count'
        }]
    });
    var ds = this.store;
    this.remove = function(){
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        form.submit({
            url: 'tr_tags.cgi',
            params: {
                action: 'removetag',
                type: obj,
                id: this.obj_id,
                tag: Testopia.Util.getSelectedObjects(Ext.getCmp(obj + 'tagsgrid'), 'tag_name')
            },
            success: function(){
                ds.reload();
            },
            failure: Testopia.Util.error
        });
    };
    this.add = function(){
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        form.submit({
            url: 'tr_tags.cgi',
            params: {
                action: 'addtag',
                type: obj,
                id: this.obj_id,
                tag: Ext.getCmp(obj + 'tag_lookup').getRawValue()
            },
            success: function(){
                ds.reload();
            },
            failure: Testopia.Util.error
        });
    };
    this.columns = [{
        dataIndex: 'tag_id',
        hidden: true,
        hideable: false
    }, {
        header: 'Name',
        width: 150,
        dataIndex: 'tag_name',
        id: 'tag_name',
        sortable: true,
        hideable: false
    }, {
        header: 'Cases',
        width: 35,
        dataIndex: 'case_count',
        sortable: true,
        hidden: true,
        renderer: Testopia.Tags.renderer.createDelegate(this, ['case'], true)
    }, {
        header: 'Runs',
        width: 35,
        dataIndex: 'run_count',
        sortable: true,
        hidden: true,
        renderer: Testopia.Tags.renderer.createDelegate(this, ['run'], true)
    }, {
        header: 'Plans',
        width: 35,
        dataIndex: 'plan_count',
        sortable: true,
        hidden: true,
        renderer: Testopia.Tags.renderer.createDelegate(this, ['plan'], true)
    }];
    
    var addButton = new Ext.Button({
        id: 'tag_add_btn',
        icon: 'extensions/testopia/img/add.png',
        iconCls: 'img_button_16x',
        handler: this.add.createDelegate(this)
    });
    
    var deleteButton = new Ext.Button({
        icon: 'extensions/testopia/img/delete.png',
        iconCls: 'img_button_16x',
        handler: this.remove.createDelegate(this)
    });
    
    Testopia.Tags.ObjectTags.superclass.constructor.call(this, {
        title: 'Tags',
        split: true,
        region: 'east',
        layout: 'fit',
        width: 200,
        autoExpandColumn: "tag_name",
        collapsible: true,
        id: obj + 'tagsgrid',
        loadMask: {
            msg: 'Loading ' + obj + ' tags...'
        },
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false
        }),
        viewConfig: {
            forceFit: true
        },
        tbar: [new Testopia.Tags.Lookup({
            id: obj + 'tag_lookup'
        }), addButton, deleteButton]
    });
    
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.Tags.ObjectTags, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'tags-ctx-menu',
                enableScrolling: false,
                items: [{
                    text: 'Remove Selected Tags',
                    icon: 'extensions/testopia/img/delete.png',
                    iconCls: 'img_button_16x',
                    obj_id: this.obj_id,
                    handler: this.remove
                }, {
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
        if (!this.store.getCount() || this.orig_id != this.obj_id) {
            this.store.load({
                params: {
                    id: this.obj_id
                }
            });
        }
    }
});

/*
 * Testopia.Tags.ProductTags - Display a grid of tags for a product, or a user.
 */
Testopia.Tags.ProductTags = function(title, type, product_id){
    var tag_id;
    this.product_id = product_id;
    
    this.store = new Ext.data.JsonStore({
        url: 'tr_tags.cgi',
        listeners: { 'exception': Testopia.Util.loadError },
        baseParams: {
            action: 'gettags',
            type: type
        },
        root: 'tags',
        id: 'tag_id',
        fields: [{
            name: 'tag_id',
            mapping: 'tag_id'
        }, {
            name: 'tag_name',
            mapping: 'tag_name'
        }, {
            name: 'run_count',
            mapping: 'run_count'
        }, {
            name: 'case_count',
            mapping: 'case_count'
        }, {
            name: 'plan_count',
            mapping: 'plan_count'
        }]
    });
    var ds = this.store;
    
    this.columns = [{
        header: "ID",
        dataIndex: 'tag_id',
        hidden: true
    }, {
        header: 'Name',
        width: 150,
        dataIndex: 'tag_name',
        id: 'tag_name',
        sortable: true
    }, {
        header: 'Cases',
        width: 35,
        dataIndex: 'case_count',
        sortable: true,
        renderer: Testopia.Tags.renderer.createDelegate(this, ['case', product_id], true)
    }, {
        header: 'Runs',
        width: 35,
        dataIndex: 'run_count',
        sortable: true,
        renderer: Testopia.Tags.renderer.createDelegate(this, ['run', product_id], true)
    }, {
        header: 'Plans',
        width: 35,
        dataIndex: 'plan_count',
        sortable: true,
        renderer: Testopia.Tags.renderer.createDelegate(this, ['plan', product_id], true)
    }];
    
    var filter = new Ext.form.TextField({
        allowBlank: true,
        id: 'rungrid-filter',
        selectOnFocus: true
    });
    
    Testopia.Tags.ProductTags.superclass.constructor.call(this, {
        title: title,
        id: type + 'tags',
        loadMask: {
            msg: 'Loading ' + title + ' ...'
        },
        autoExpandColumn: "tag_name",
        autoScroll: true,
        sm: new Ext.grid.RowSelectionModel({
            singleSelect: false
        }),
        viewConfig: {
            forceFit: true
        }
    });
    
    this.on('rowcontextmenu', this.onContextClick, this);
    this.on('activate', this.onActivate, this);
};

Ext.extend(Testopia.Tags.ProductTags, Ext.grid.GridPanel, {
    onContextClick: function(grid, index, e){
    
        if (!this.menu) { // create context menu on first right click
            this.menu = new Ext.menu.Menu({
                id: 'tags-ctx-menu',
                enableScrolling: false,
                items: [{
                    text: 'Refresh',
                    icon: 'extensions/testopia/img/refresh.png',
                    iconCls: 'img_button_16x',
                    handler: function(){
                        ds.reload();
                    }
                }]
            });
        }
        e.stopEvent();
        this.menu.showAt(e.getXY());
    },
    
    onActivate: function(event){
        if (!this.store.getCount()) {
            this.store.load({
                params: {
                    product_id: this.product_id
                }
            });
        }
    }
});

Testopia.Tags.update = function(type, grid){
    function commitTag(action, value, grid){
        var form = new Ext.form.BasicForm('testopia_helper_frm', {});
        form.submit({
            url: 'tr_tags.cgi',
            params: {
                action: action,
                tag: value,
                type: type,
                id: Testopia.Util.getSelectedObjects(grid, type + '_id')
            },
            success: function(){
            },
            failure: Testopia.Util.error
        });
    }
    var win = new Ext.Window({
        title: 'Add or Remove Tags',
        id: 'tags_edit_win',
        layout: 'fit',
        split: true,
        plain: true,
        shadow: false,
        width: 350,
        listeners: {'afterlayout':function(){Ext.getCmp('tags_update').focus('',10)}},
        height: 150,
        items: [new Ext.FormPanel({
            labelWidth: '40',
            bodyStyle: 'padding: 5px',
            items: [new Testopia.Tags.Lookup({
                id: 'tags_update',
                fieldLabel: 'Tags'
            })]
        })],
        buttons: [{
            text: 'Add Tag',
            handler: function(){
                commitTag('addtag', Ext.getCmp('tags_update').getRawValue(), grid);
                win.close();
            }
        }, {
            text: 'Remove Tag',
            handler: function(){
                commitTag('removetag', Ext.getCmp('tags_update').getRawValue(), grid);
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

/*
 * END OF FILE - /bnc/extensions/testopia/js/tags.js
 */

/*
 * JavaScript file created by Rockstarapps Concatenation
*/
