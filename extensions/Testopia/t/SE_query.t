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
# Contributor(s): Greg Hendricks <ghendricks@novell.com>
#                 Jeff Dayley    <jedayley@novell.com>
#                 Ben Warby      <bwarby@novell.com>

use strict;

use lib "..";
use lib "../..";

use Test::More tests => 4;
use Test::Deep;

use Bugzilla;
use Bugzilla::Util;
use Bugzilla::Constants;

use Testopia::Product;
use Testopia::Environment;

use Bugzilla::Extension::Testopia::Test::Util;
use Bugzilla::Extension::Testopia::Test::Constants;
use Bugzilla::Extension::Testopia::Test::Selenium::Util;
use Bugzilla::Extension::Testopia::Test::Selenium::Constants;

my ($user_type, $login, $passwd) = @ARGV;

use constant DEBUG => 1;

Bugzilla->error_mode(ERROR_MODE_DIE);

my $isanon = 0;
# $se object from Test::Selenium::Util
$se->start();

if ($login && $passwd){
    unless ( Bugzilla::Extension::Testopia::Test::Selenium::Util->login( $login, $passwd) ) {
        $se->stop();
        fail('login');
        exit;
    }
}
else {
    $se->open( 'tr_environments.cgi' );
    $se->wait_for_page_to_load(TIMEOUT);
    $se->pause(3000) if DEBUG;
    
    ok( $se->is_text_present("I need a legitimate login and password to continue"), "anonymous user check" );
    $isanon = 1;

}
SKIP: {
    skip "Anonymous Login", 2 if $isanon;
    test_add();
    test_edit();
}
