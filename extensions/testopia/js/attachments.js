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
