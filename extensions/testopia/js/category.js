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

