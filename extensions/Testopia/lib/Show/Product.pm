# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Show::Product;
use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::Constants;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    Bugzilla->login(LOGIN_REQUIRED);

    print $cgi->header;

    my $product;
    my $pid = $input->{'product_id'} || $cgi->cookie('TESTOPIA_PRODUCT_ID') || 0;
    if ($pid) {
        $product = Bugzilla::Extension::Testopia::Product->new($pid);
        if ($product) {
            ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canview;
        }
        $vars->{'product'} = $product;
        $vars->{'cookiepath'} = Bugzilla->params->{'cookiepath'};
    }

    $input->{'current_tab'} ='plan';
    $input->{'pagesize'} = $input->{'limit'};
    $input->{'name_type'} = 'allwordssubstr';
    if (exists $input->{'start'}) {
        $input->{'page'} = $input->{'start'}/$input->{'limit'};
    }

    my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
    my $table = Bugzilla::Extension::Testopia::Table->new('plan', 'page.cgi?id=tr_list_plans.html', $cgi, undef, $search->query);
    my $action = $input->{'action'} || '';

    $vars->{'table'} = $table;
    $vars->{'search'} = $input->{'search'};
    $vars->{'case'} = Bugzilla::Extension::Testopia::TestCase->new({});

    $vars->{'dashboard'} = $input->{'dashboard'};
    $vars->{'userid'} = $input->{'userid'};

    $template->process("testopia/product/show.html.tmpl", $vars)
        || ThrowTemplateError($template->error());
}

1;
