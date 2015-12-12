# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::List::Environments;

use strict;
use warnings;

use Bugzilla::Config;
use Bugzilla::Constants;
use Bugzilla::Error;

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Product;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    Bugzilla->login(LOGIN_REQUIRED);

    Bugzilla->error_mode(ERROR_MODE_AJAX) if ($input->{'ctype'} eq 'json');

    my $format = $template->get_format("testopia/case/list", $input->{'format'}, $input->{'ctype'});
    my $action = $input->{'action'} || '';

    $vars->{'qname'} = $input->{'qname'} if $input->{'qname'};

    $input->{'current_tab'} = 'environment';
    $input->{'distinct'} = '1';

    # We have to do this until we have product level permission checks in place
    my $product_id = $input->{'product_id'};
    unless ($product_id) {
        print $cgi->header;
        ThrowUserError("testopia-missing-parameter", {param => "product_id"});
    }

    my $product = Bugzilla::Extension::Testopia::Product->new($product_id);
    unless ($product && $product->canview) {
        print $cgi->header;
        ThrowUserError('testopia-read-only', {'object' => $product});
    }

    my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
    my $table = Bugzilla::Extension::Testopia::Table->new('environment',
                    'page.cgi?id=tr_list_environments.html', $cgi, undef, $search->query);

    if ($input->{'ctype'} eq 'json') {
        print $cgi->header;
        $vars->{'json'} = $table->to_ext_json;
        $template->process($format->{'template'}, $vars)
            || ThrowTemplateError($template->error());
    }
    else {
        print "Location: page.cgi?id=tr_show_product.html&tab=environments\n\n";
    }
}

1;
