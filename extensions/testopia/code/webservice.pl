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
# The Original Code is the Bugzilla Bug Tracking System.
#
# The Initial Developer of the Original Code is Everything Solved, Inc.
# Portions created by Everything Solved, Inc. are Copyright (C) 2007 
# Everything Solved, Inc. All Rights Reserved.
#
# Contributor(s): Max Kanat-Alexander <mkanat@bugzilla.org>

use strict;
use warnings;
use Bugzilla;

my $dispatch = Bugzilla->hook_args->{dispatch};

$dispatch->{TestPlan}    = "extensions::testopia::lib::Testopia::WebService::TestPlan";
$dispatch->{TestCase}    = "extensions::testopia::lib::Testopia::WebService::TestCase";
$dispatch->{TestRun}     = "extensions::testopia::lib::Testopia::WebService::TestRun";
$dispatch->{TestCaseRun} = "extensions::testopia::lib::Testopia::WebService::TestCaseRun";
$dispatch->{Product}     = "extensions::testopia::lib::Testopia::WebService::Product";
$dispatch->{Environment} = "extensions::testopia::lib::Testopia::WebService::Environment";
$dispatch->{Build}       = "extensions::testopia::lib::Testopia::WebService::Build";
$dispatch->{Testopia}    = "extensions::testopia::lib::Testopia::WebService::Testopia";

