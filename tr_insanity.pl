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
# Portions created by Greg Hendricks are Copyright (C) 2006
# Novell. All Rights Reserved.
#
# Portions lifted from bugzilla's sanitycheck.cgi
#
# Contributor(s): Greg Hendricks <ghendricks@novell.com>

use strict;

use lib qw(. lib);

use Bugzilla;
use Bugzilla::Constants;
use Bugzilla::Util;
use Bugzilla::Error;
use Bugzilla::User;

my $dbh = Bugzilla->dbh;


# Removed orphaned records

$dbh->bz_lock_tables('test_plan_permissions WRITE', 'test_plan_permissions_regexp WRITE',
                     'test_plans READ');

foreach my $pair ('test_plan_permissions/plan_id', 'test_plan_permissions_regexp/plan_id') {

    my ($table, $field) = split('/', $pair);

    my $ids = $dbh->selectcol_arrayref(
        "SELECT $table.$field FROM $table
           LEFT JOIN test_plans ON $table.$field = test_plans.plan_id
          WHERE test_plans.plan_id IS NULL");

    if (scalar(@$ids)) {
        $dbh->do("DELETE FROM $table WHERE $field IN (" . join(',', @$ids) . ")");
    }
}

$dbh->bz_unlock_tables();
