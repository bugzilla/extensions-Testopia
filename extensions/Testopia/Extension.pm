package Bugzilla::Extension::Testopia;

use strict;
use warnings;

use base qw(Bugzilla::Extension);

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Install;
use Bugzilla::Extension::Testopia::Product;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::TestPlan;
use Bugzilla::Extension::Testopia::TestRun;
use Bugzilla::Constants;
use Bugzilla::Group;
use Bugzilla::Status;
use Bugzilla::User::Setting;
use Bugzilla::Util;

use File::Path;
use JSON;

BEGIN {
    *Bugzilla::Bug::get_test_case_count = \&get_test_case_count;
    *Bugzilla::User::testopia_queries = \&testopia_queries;
    # We must redefine these two methods.
    undef &Bugzilla::User::get_selectable_products;
    undef &Bugzilla::User::derive_regexp_groups;
    *Bugzilla::User::get_selectable_products = \&get_selectable_products;
    *Bugzilla::User::derive_regexp_groups =\&derive_regexp_groups;
}

our $VERSION = '2.6';

sub WS_EXECUTE { Bugzilla->localconfig->{'webservergroup'} ? 0750 : 0755 };

# The subroutines below are used in the BEGIN block above to extend
# or redefine some methods in Bugzilla::Bug and Bugzilla::User.

sub get_test_case_count {
      my $self = shift;
      my $dbh = Bugzilla->dbh;
      my $row_count = $dbh->selectall_arrayref(
              "SELECT DISTINCT case_id FROM test_case_bugs WHERE bug_id = ?",
              undef, $self->bug_id);
      return scalar @$row_count;
}

sub testopia_queries {
    my $self = shift;
    my $dbh = Bugzilla->dbh;
    my $ref = $dbh->selectall_arrayref(
        "SELECT name, query FROM test_named_queries
         WHERE userid = ? AND isvisible = 1",
         {'Slice' =>{}}, $self->id);
    return $ref;
}

sub get_selectable_products {
    my $self = shift;
    my $class_id = shift;
    my $class_restricted = Bugzilla->params->{'useclassification'} && $class_id;

    if (!defined $self->{selectable_products}) {
        my $query = "(SELECT id, name AS pname " .
                    "  FROM products " .
                 "LEFT JOIN group_control_map " .
                        "ON group_control_map.product_id = products.id " .
                      " AND group_control_map.membercontrol = " . CONTROLMAPMANDATORY .
                      " AND group_id NOT IN(" . $self->groups_as_string . ") " .
                  "   WHERE group_id IS NULL) " ;

        $query .= "UNION (SELECT id, tr_products.name AS pname FROM products AS tr_products ".
                  "INNER JOIN test_plans ON tr_products.id = test_plans.product_id ".
                  "INNER JOIN test_plan_permissions ON test_plan_permissions.plan_id = test_plans.plan_id ".
                  "WHERE test_plan_permissions.userid = ?)";

        $query .= " ORDER BY pname ";

        my $prod_ids = Bugzilla->dbh->selectcol_arrayref($query,undef,$self->id);

        $self->{selectable_products} = Bugzilla::Product->new_from_list($prod_ids);
    }

    # Restrict the list of products to those being in the classification, if any.
    if ($class_restricted) {
        return [grep {$_->classification_id == $class_id} @{$self->{selectable_products}}];
    }
    # If we come here, then we want all selectable products.
    return $self->{selectable_products};
}

sub derive_regexp_groups {
    my ($self) = @_;

    my $id = $self->id;
    return unless $id;

    my $dbh = Bugzilla->dbh;

    my $sth;

    # add derived records for any matching regexps

    $sth = $dbh->prepare("SELECT id, userregexp, user_group_map.group_id
                            FROM groups
                       LEFT JOIN user_group_map
                              ON groups.id = user_group_map.group_id
                             AND user_group_map.user_id = ?
                             AND user_group_map.grant_type = ?");
    $sth->execute($id, GRANT_REGEXP);

    my $group_insert = $dbh->prepare(q{INSERT INTO user_group_map
                                       (user_id, group_id, isbless, grant_type)
                                       VALUES (?, ?, 0, ?)});
    my $group_delete = $dbh->prepare(q{DELETE FROM user_group_map
                                       WHERE user_id = ?
                                         AND group_id = ?
                                         AND isbless = 0
                                         AND grant_type = ?});
    while (my ($group, $regexp, $present) = $sth->fetchrow_array()) {
        if (($regexp ne '') && ($self->login =~ m/$regexp/i)) {
            $group_insert->execute($id, $group, GRANT_REGEXP) unless $present;
        } else {
            $group_delete->execute($id, $group, GRANT_REGEXP) if $present;
        }
    }
    # Now do the same for Testopia test plans.
    $sth = $dbh->prepare("SELECT test_plan_permissions_regexp.plan_id,
                                 user_regexp, test_plan_permissions_regexp.permissions,
                                 test_plan_permissions.plan_id
                          FROM test_plan_permissions_regexp
                     LEFT JOIN test_plan_permissions
                            ON test_plan_permissions_regexp.plan_id = test_plan_permissions.plan_id
                           AND test_plan_permissions.userid = ?
                           AND test_plan_permissions.grant_type = ?");

    $sth->execute($id, GRANT_REGEXP);
    my $plan_insert = $dbh->prepare(q{INSERT INTO test_plan_permissions
                                       (userid, plan_id, permissions, grant_type)
                                       VALUES (?, ?, ?, ?)});
    my $plan_delete = $dbh->prepare(q{DELETE FROM test_plan_permissions
                                       WHERE userid = ?
                                         AND plan_id = ?
                                         AND grant_type = ?});

    while (my ($planid, $regexp, $perms, $present) = $sth->fetchrow_array()) {
        if (($regexp ne '') && ($self->{login} =~ m/$regexp/i)) {
            $plan_insert->execute($id, $planid, $perms, GRANT_REGEXP) unless $present;
        } else {
            $plan_delete->execute($id, $planid, GRANT_REGEXP) if $present;
        }
    }
}

# End of redefined subroutines.

sub bug_end_of_update {
    my ($self, $args) = @_;

    my $bug = $args->{'bug'};
    my $timestamp = $args->{'timestamp'};
    my $changes = $args->{'changes'};
    my $dbh = Bugzilla->dbh;
    
    foreach my $field (keys %$changes) {
        my $used_to_be = $changes->{$field}->[0];
        my $now_it_is  = $changes->{$field}->[1];
    }
    
    my $tcrs = $dbh->selectcol_arrayref("SELECT case_id FROM test_case_bugs WHERE bug_id = ?", undef, $bug->id);
    
    my $status_message;
    if (my $status_change = $changes->{'bug_status'}) {
        my $old_status = new Bugzilla::Status({ name => $status_change->[0] });
        my $new_status = new Bugzilla::Status({ name => $status_change->[1] });
        if ($new_status->is_open && !$old_status->is_open) {
            for my $tcr(@$tcrs) {
                my $tc = Bugzilla::Extension::Testopia::TestCase->new($tcr);
                $tc->remove_tag('BUGFIXED');
            }
        }
        if (!$new_status->is_open && $old_status->is_open) {
            for my $tcr(@$tcrs) {
                my $tc = Bugzilla::Extension::Testopia::TestCase->new($tcr);
                $tc->add_tag('BUGFIXED');
            }        
        }
    }
}

sub buglist_columns {
    my ($self, $args) = @_;
    my $columns = $args->{'columns'};
    $columns->{'test_cases'} = { 'name' => 'tcb.case_id' , 'title' => 'Test Cases' };
}

sub buglist_column_joins {
    my ($self, $args) = @_;
    my $joins = $args->{column_joins};
    $joins->{test_cases} = { table => 'test_case_bugs', as => 'tcb' };
}

sub config_add_panels {
    my ($self, $args) = @_;
    
    my $modules = $args->{panel_modules};
    $modules->{Testopia} = "Bugzilla::Extension::Testopia::Config";
}

sub db_schema_abstract_schema {
    my ($self, $args) = @_;
    my $schema = $args->{schema};

    Bugzilla::Extension::Testopia::Install::set_db_schema_abstract_schema($schema);
}

sub enter_bug_entrydefaultvars {
    my ($self, $args) = @_;
    
    my $vars = $args->{vars};
    my $cgi = Bugzilla->cgi;
    
    $vars->{'case_id'} = $cgi->param('case_id');
    $vars->{'caserun_id'} = $cgi->param('caserun_id');
}

sub error_catch {
    my ($self, $args) = @_;
    return unless Bugzilla->error_mode == ERROR_MODE_AJAX;

    # JSON can't handle strings across lines.
    my $message = ${$args->{message}};
    $message =~ s/\n/ /gm;
    my $err = { success => JSON::false,
                error   => $args->{error},
                message => $message };
    my $json = new JSON;
    print $json->encode($err);
    exit;
}

sub install_before_final_checks {
    my ($self, $args) = @_;
    
    
    add_setting('view_testopia', ['on', 'off'], 'on');
    
    if ( -e './testopia/patch-3.2'){
        print <<END;
    
        WARNING:
        We are about to remove the old Testopia files that have been moved 
        to the extensions directory. If you have made any changes to Testopia
        you should first merge these changes into the equivilent files in the
        extensions/Testopia directory. Here are a list of files that are changing
        and their new locations:
        
            testopia (dir)   -> extensions/Testopia/
            Bugzilla/Testopia/ (dir) -> extensions/Testopia/lib
            Bugzilla/WebService/Testopia/ (dir) -> extensions/Testopia/lig/WebService
            Bugzilla/Config/Testopia.pm -> extensions/Testopia/lib/Testopia/Config.pm
            skins/standard/testopia.css -> extensions/Testopia/css/testopia.css
            template/en/default/testopia/ (dir) -> extensions/Testopia/template/en/default
            
            The following templates and template hooks have been moved to the 
                extensions/Testopia/template directory:
                
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
            
            testopia.dtd    (use extensions/Testopia/testopia.xsd instead)
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
}

sub install_filesystem {
    my ($self, $args) = @_;
    $args->{'files'}->{'tr_importxml.pl'} = { perms => WS_EXECUTE };
}

sub install_update_db {
    my ($self, $args) = @_;
    Bugzilla::Extension::Testopia::Install::install_update_db();
}

sub page_before_template {
    my ($self, $args) = @_;
    my $page = $args->{'page_id'};
    my $vars = $args->{'vars'};

    if ($page eq 'tr_admin.html') {
        require Bugzilla::Extension::Testopia::Admin;
        Bugzilla::Extension::Testopia::Admin::report($vars);
    }
    elsif ($page eq 'tr_case_reports.html') {
        require Bugzilla::Extension::Testopia::Reports::Case;
        Bugzilla::Extension::Testopia::Reports::Case::report($vars);
    }
}

sub post_bug_after_creation {
    my ($self, $args) = @_;
    
    
    my $vars = $args->{vars};
    my $cgi = Bugzilla->cgi;
    
    my $caserun_id = $cgi->param('caserun_id');
    my $case_id = $cgi->param('case_id'); 
    if (detaint_natural($caserun_id)) {
        my $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new($cgi->param('caserun_id'));
        ThrowUserError("invalid-test-id-non-existent", {'id' => $caserun_id, 'type' => 'Case-Run'}) unless $caserun;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;
        
        $caserun->attach_bug($vars->{'id'});
    
        $vars->{'caserun'} = $caserun;
    }
    elsif (detaint_natural($case_id)) {
        my $case = Bugzilla::Extension::Testopia::TestCase->new($cgi->param('case_id'));
        ThrowUserError("invalid-test-id-non-existent", {'id' => $case_id, 'type' => 'Case'}) unless $case;
        ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;
        
        $case->attach_bug($vars->{'id'});
    
        $vars->{'case'} = $case;
    }
    
}

sub product_confirm_delete {
    my ($self, $args) = @_;
    
    
    
    my $vars = $args->{vars};
    
    $vars->{'testopia_product'} = new Bugzilla::Extension::Testopia::Product($vars->{product}->id);
}

sub webservice {
    my ($self, $args) = @_;
    
    my $dispatch = $args->{dispatch};
    
    $dispatch->{TestPlan}    = "Bugzilla::Extension::Testopia::WebService::TestPlan";
    $dispatch->{TestCase}    = "Bugzilla::Extension::Testopia::WebService::TestCase";
    $dispatch->{TestRun}     = "Bugzilla::Extension::Testopia::WebService::TestRun";
    $dispatch->{TestCaseRun} = "Bugzilla::Extension::Testopia::WebService::TestCaseRun";
    $dispatch->{Environment} = "Bugzilla::Extension::Testopia::WebService::Environment";
    $dispatch->{Build}       = "Bugzilla::Extension::Testopia::WebService::Build";
    $dispatch->{Testopia}    = "Bugzilla::Extension::Testopia::WebService::Testopia";
    $dispatch->{TestopiaUser} = "Bugzilla::Extension::Testopia::WebService::User";
    $dispatch->{TestopiaProduct} = "Bugzilla::Extension::Testopia::WebService::Product";
}



__PACKAGE__->NAME;
