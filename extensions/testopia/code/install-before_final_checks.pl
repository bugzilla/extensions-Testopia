#!/usr/bin/perl -w
# -*- Mode: perl; indent-tabs-mode: nil -*-
#
# The contents of this file are subject to the Mozilla Public
# License Version 1.1 (the "License"); you may not use this file
# except in compliance with the License. You may obtain a copy of
# the License at http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS
# IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
# implied. See the License for the specific language governing
# rights and limitations under the License.
#
# The Original Code is the Bugzilla Testopia System.
#
# The Initial Developer of the Original Code is Greg Hendricks.
# Portions created by Greg Hendricks are Copyright (C) 2009
# Novell. All Rights Reserved.
#
# Contributor(s): Greg Hendricks <ghendricks@novell.com>

use strict;
use lib '.';
use Bugzilla;
use Bugzilla::User::Setting;
use File::Path;

add_setting('view_testopia', ['on', 'off'], 'on');

if ( -e './testopia/patch-3.2'){
    print <<END;

    WARNING:
    We are about to remove the old Testopia files that have been moved 
    to the extensions directory. If you have made any changes to Testopia
    you should first merge these changes into the equivilent files in the
    extensions/testopia directory. Here are a list of files that are changing
    and their new locations:
    
        testopia (dir)   -> extensions/testopia/
        Bugzilla/Testopia/ (dir) -> extensions/testopia/lib
        Bugzilla/WebService/Testopia/ (dir) -> extensions/testopia/lig/WebService
        Bugzilla/Config/Testopia.pm -> extensions/testopia/lib/Testopia/Config.pm
        skins/standard/testopia.css -> extensions/testopia/css/testopia.css
        template/en/default/testopia/ (dir) -> extensions/testopia/template/en/default
        
        The following templates and template hooks have been moved to the 
            extensions/testopia/template directory:
            
        template/en/default/admin/params/testopia.html.tmpl 
        template/en/default/hook/admin/products/confirm-delete.html.tmpl
        template/en/default/hook/admin/products/confirm-delete.html.tmpl/confirmation/testopia.html.tmpl
        template/en/default/hook/bug/create/created.html.tmpl/message/tr.html.tmpl
        template/en/default/hook/bug/create/create.html.tmpl/end/tr.html.tmpl
        template/en/default/hook/bug/create/create.html.tmpl/form/tr.html.tmpl
        template/en/default/hook/bug/edit.html.tmpl/after_custom_fields/tr.html.tmpl
        template/en/default/hook/bug/process/results.html.tmpl/links/tr.html.tmpl
        template/en/default/hook/global/banner.html.tmpl/version/testopia.html.tmpl
        template/en/default/hook/global/code-error.html.tmpl/errors/testopia_errors.html.tmpl
        template/en/default/hook/global/common-links.html.tmpl/link-row/testopia.html.tmpl
        template/en/default/hook/global/header.html.tmpl/additional_header/testopia_styles.html.tmpl
        template/en/default/hook/global/useful-links.html.tmpl/end/tr.html.tmpl
        template/en/default/hook/global/user-error.html.tmpl/errors/tr-user-error.html.tmpl
        template/en/default/hook/index.html.tmpl/links/tr.html.tmpl
        template/en/default/hook/list/list.html.tmpl/links/tr.html.tmpl
        
        The following files are no longer needed and will be removed:
        
        testopia.dtd    (use extensions/testopia/testopia.xsd instead)
        tr_csv2xml.pl   (use tr_importer.cgi instead)
        tr_xmlrpc.cgi   (use bugzilla's xmlrpc or create a link to it)
    
    If you have changes to merge, you should answer NO. Otherwise answer YES.
    Do you wish to continue and delete these files? (YES/no)
    
END
    my $response = <STDIN>;
    die "Exiting... \n" if $response !~ /y/i;
    
    my @files = qw(
        testopia
        testopia.dtd
        tr_csv2xml.pl
        tr_xmlrpc.cgi
        Bugzilla/Testopia/
        Bugzilla/WebService/Testopia/
        Bugzilla/Config/Testopia.pm 
        skins/standard/testopia.css 
        template/en/default/testopia/
        template/en/default/admin/params/testopia.html.tmpl 
        template/en/default/hook/admin/products/confirm-delete.html.tmpl
        template/en/default/hook/admin/products/confirm-delete.html.tmpl/confirmation/testopia.html.tmpl
        template/en/default/hook/bug/create/created.html.tmpl/message/tr.html.tmpl
        template/en/default/hook/bug/create/create.html.tmpl/end/tr.html.tmpl
        template/en/default/hook/bug/create/create.html.tmpl/form/tr.html.tmpl
        template/en/default/hook/bug/edit.html.tmpl/after_custom_fields/tr.html.tmpl
        template/en/default/hook/bug/process/results.html.tmpl/links/tr.html.tmpl
        template/en/default/hook/global/banner.html.tmpl/version/testopia.html.tmpl
        template/en/default/hook/global/code-error.html.tmpl/errors/testopia_errors.html.tmpl
        template/en/default/hook/global/common-links.html.tmpl/link-row/testopia.html.tmpl
        template/en/default/hook/global/header.html.tmpl/additional_header/testopia_styles.html.tmpl
        template/en/default/hook/global/useful-links.html.tmpl/end/tr.html.tmpl
        template/en/default/hook/global/user-error.html.tmpl/errors/tr-user-error.html.tmpl
        template/en/default/hook/index.html.tmpl/links/tr.html.tmpl
        template/en/default/hook/list/list.html.tmpl/links/tr.html.tmpl
    );
    
    rmtree(@files, 1);
}
