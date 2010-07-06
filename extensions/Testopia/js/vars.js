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

Ext.BLANK_IMAGE_URL = 'extensions/Testopia/extjs/resources/images/default/s.gif'; 

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
Testopia.StatusButton = function(cfg){ 
    Ext.apply(this, cfg); 
}

Ext.extend(Testopia.StatusButton, Ext.Button, {
    getTemplateArgs : function(){
        return [this.icon];
    }
});
        
var imgButtonTpl = new Ext.Template(
'<table border="0" cellpadding="0" cellspacing="0" name="foo"><tbody><tr>' +
'<td><button type="button"><img src="extensions/Testopia/img/IDLE.gif"></button></td>' +
'</tr></tbody></table>');
