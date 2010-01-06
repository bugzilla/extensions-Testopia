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
# The Original Code is the Bugzilla Test Runner System.
#
# The Initial Developer of the Original Code is Maciej Maczynski.
# Portions created by Maciej Maczynski are Copyright (C) 2001
# Maciej Maczynski. All Rights Reserved.
#
# Contributor(s): Greg Hendricks <ghendricks@novell.com>

package Testopia::Constants;
use strict;
use base qw(Exporter);

@Testopia::Constants::EXPORT = qw(
TESTOPIA_VERSION

PROPOSED
CONFIRMED
DISABLED

IDLE
PASSED
FAILED
RUNNING
PAUSED
BLOCKED
ERROR

TR_READ
TR_WRITE
TR_DELETE
TR_ADMIN

REL_AUTHOR
REL_EDITOR
REL_TESTER
REL_TEST_CC

TR_RELATIONSHIPS

CASE_RUN_STATUSES

SAVED_SEARCH
SAVED_REPORT
SAVED_FILTER
SAVED_DASHBORD

TIME_FORMAT
);

use constant TESTOPIA_VERSION => "2.3.1";

# Test Case Status
use constant PROPOSED  => 1;
use constant CONFIRMED => 2;
use constant DISABLED  => 3;

# Test case Run Status
use constant IDLE    => 1;
use constant PASSED  => 2;
use constant FAILED  => 3;
use constant RUNNING => 4;
use constant PAUSED  => 5;
use constant BLOCKED => 6;
use constant ERROR   => 7;

use constant CASE_RUN_STATUSES => IDLE, PASSED, FAILED, RUNNING, PAUSED, BLOCKED, ERROR;
 
# Test Plan Permissions (bit flags)
use constant TR_READ    => 1;
use constant TR_WRITE   => 2;
use constant TR_DELETE  => 4;
use constant TR_ADMIN   => 8;

# Save search types
use constant SAVED_SEARCH => 0;
use constant SAVED_REPORT => 1;
use constant SAVED_FILTER => 2;
use constant SAVED_DASHBORD => 3;

# Testopia Relationships
use constant REL_AUTHOR             => 100;
use constant REL_EDITOR             => 101;
use constant REL_TESTER             => 102;
use constant REL_TEST_CC            => 103;

use constant RELATIONSHIPS => REL_AUTHOR, REL_EDITOR, REL_TESTER, REL_TEST_CC;

use constant TIME_FORMAT => '%b %e %Y %T %Z';

1;
