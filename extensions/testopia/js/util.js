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
