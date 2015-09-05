# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Show::Case;

use strict;
use warnings;

use Bugzilla::Util;
use Bugzilla::Error;
use Bugzilla::Constants;

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::Constants;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    Bugzilla->login(LOGIN_REQUIRED);

    my $case_id = trim($input->{'case_id'}) || '';

    unless ($case_id) {
        print $cgi->header();
        $template->process("testopia/case/choose.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }

    my $case = Bugzilla::Extension::Testopia::TestCase->new($case_id);
    ThrowUserError("invalid-test-id-non-existent", {'type' => 'case', id => $case_id}) unless $case;
    ThrowUserError("testopia-permission-denied", {'object' => $case}) unless $case->canview;

    my $format = $template->get_format("testopia/case/show", scalar $input->{'format'}, scalar $input->{'ctype'});
    my $disp = "inline";
    # We set CSV files to be downloaded, as they are designed for importing
    # into other programs.
    if ($format->{'extension'} eq "csv" || $format->{'extension'} eq "xml") {
        $disp = "attachment";
        $vars->{'displaycolumns'} = Bugzilla::Extension::Testopia::TestCase::fields;
    }

    $vars->{'table'} = Bugzilla::Extension::Testopia::Table->new('case', 'page.cgi?id=tr_list_cases.html', $cgi);

    # Suggest a name for the file if the user wants to save it as a file.
    my @time = localtime(time());
    my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
    my $filename = "testcase-$case_id-$date.$format->{extension}";
    print $cgi->header( -type => $format->{'ctype'},
                        -content_disposition => "$disp; filename=$filename");

    $vars->{'case'} = $case;
    $template->process($format->{'template'}, $vars) ||
        ThrowTemplateError($template->error());
}

1;
