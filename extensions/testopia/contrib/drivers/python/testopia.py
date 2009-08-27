#!/usr/bin/python
"""
The contents of this file are subject to the Mozilla Public
License Version 1.1 (the "License"); you may not use this file
except in compliance with the License. You may obtain a copy of
the License at http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS
IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
implied. See the License for the specific language governing
rights and limitations under the License.

The Original Code is the Bugzilla Testopia Python API Driver.

The Initial Developer of the Original Code is Airald Hapairai.
Portions created by Airald Hapairai are Copyright (C) 2008
Novell. All Rights Reserved.
Portions created by David Malcolm are Copyright (C) 2008 Red Hat.
All Rights Reserved.
Portions created by Will Woods are Copyright (C) 2008 Red Hat.
All Rights Reserved.
Portions created by Bill Peck are Copyright (C) 2008 Red Hat.
All Rights Reserved.

Contributor(s): Airald Hapairai
  David Malcolm <dmalcolm@redhat.com>
  Will Woods <wwoods@redhat.com>
  Bill Peck <bpeck@redhat.com>

The CookieTransport class is by Will Woods, based on code in
Python's xmlrpclib.Transport, which has this copyright notice:

# The XML-RPC client interface is
#
# Copyright (c) 1999-2002 by Secret Labs AB
# Copyright (c) 1999-2002 by Fredrik Lundh
#
# By obtaining, using, and/or copying this software and/or its
# associated documentation, you agree that you have read, understood,
# and will comply with the following terms and conditions:
#
# Permission to use, copy, modify, and distribute this software and
# its associated documentation for any purpose and without fee is
# hereby granted, provided that the above copyright notice appears in
# all copies, and that both that copyright notice and this permission
# notice appear in supporting documentation, and that the name of
# Secret Labs AB or the author not be used in advertising or publicity
# pertaining to distribution of the software without specific, written
# prior permission.
#
# SECRET LABS AB AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD
# TO THIS SOFTWARE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANT-
# ABILITY AND FITNESS.  IN NO EVENT SHALL SECRET LABS AB OR THE AUTHOR
# BE LIABLE FOR ANY SPECIAL, INDIRECT OR CONSEQUENTIAL DAMAGES OR ANY
# DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
# WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS
# ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
# OF THIS SOFTWARE.

Use this class to access Testopia via XML-RPC

Example on how to access this library,

from testopia import Testopia

t = Testopia.from_config('config.cfg')
t.testplan_get(10)

where config.cfg looks like:
[testopia]
username: jdoe@mycompany.com
password: jdoepassword
url:      https://myhost.mycompany.com/bugzilla/tr_xmlrpc.cgi

Or, more directly:
t = Testopia('jdoe@mycompany.com',
             'jdoepassword',
             'https://myhost.mycompany.com/bugzilla/tr_xmlrpc.cgi')             
t.testplan_get(10)

though this means you've embedded your login credentials in the source file.


Note: Python coding style guide does not advocate methods with more than 6-7
arguments. I've done this here with list, create, and update just to help.

-Airald Hapairai
"""

__author__="Airald Hapairai"
__date__="06/23/2008"
__version__="0.2.0.0"



import xmlrpclib, urllib2
from types import *
from datetime import datetime, time

from cookielib import CookieJar

class CookieTransport(xmlrpclib.Transport):
    '''A subclass of xmlrpclib.Transport that supports cookies.'''
    cookiejar = None
    scheme = 'http'

    # Cribbed from xmlrpclib.Transport.send_user_agent 
    def send_cookies(self, connection, cookie_request):
        if self.cookiejar is None:
            self.cookiejar = cookielib.CookieJar()
        elif self.cookiejar:
            # Let the cookiejar figure out what cookies are appropriate
            self.cookiejar.add_cookie_header(cookie_request)
            # Pull the cookie headers out of the request object...
            cookielist=list()
            for h,v in cookie_request.header_items():
                if h.startswith('Cookie'):
                    cookielist.append([h,v])
            # ...and put them over the connection
            for h,v in cookielist:
                connection.putheader(h,v)

    # This is the same request() method from xmlrpclib.Transport,
    # with a couple additions noted below
    def request(self, host, handler, request_body, verbose=0):
        h = self.make_connection(host)
        if verbose:
            h.set_debuglevel(1)

        # ADDED: construct the URL and Request object for proper cookie handling
        request_url = "%s://%s/" % (self.scheme,host)
        cookie_request  = urllib2.Request(request_url) 

        self.send_request(h,handler,request_body)
        self.send_host(h,host) 
        self.send_cookies(h,cookie_request) # ADDED. creates cookiejar if None.
        self.send_user_agent(h)
        self.send_content(h,request_body)

        errcode, errmsg, headers = h.getreply()

        # ADDED: parse headers and get cookies here
        # fake a response object that we can fill with the headers above
        class CookieResponse:
            def __init__(self,headers): self.headers = headers
            def info(self): return self.headers
        cookie_response = CookieResponse(headers)
        # Okay, extract the cookies from the headers
        self.cookiejar.extract_cookies(cookie_response,cookie_request)
        # And write back any changes
        if hasattr(self.cookiejar,'save'):
            self.cookiejar.save(self.cookiejar.filename)

        if errcode != 200:
            raise xmlrpclib.ProtocolError(
                host + handler,
                errcode, errmsg,
                headers
                )

        self.verbose = verbose

        try:
            sock = h._conn.sock
        except AttributeError:
            sock = None

        return self._parse_response(h.getfile(), sock)

class SafeCookieTransport(xmlrpclib.SafeTransport,CookieTransport):
    '''SafeTransport subclass that supports cookies.'''
    scheme = 'https'
    request = CookieTransport.request

VERBOSE=0
DEBUG=0

class TestopiaError(Exception): pass

class TestopiaXmlrpcError(Exception):
    def __init__(self, verb, params, wrappedError):
        self.verb = verb
        self.params = params
        self.wrappedError = wrappedError

    def __str__(self):
        return "Error while executing cmd '%s' --> %s" \
               % ( self.verb + "(" + self.params + ")", self.wrappedError)
    
class Testopia(object):

    view_all=True # By default, a list returns at most 25 elements. We force here to see all.

    # (this decorator will require python 2.4 or later)
    @classmethod
    def from_config(cls, filename):
        """
        Make a Testopia instance from a config file, looking for a
        [testopia] stanza, containing 'login', 'password' and 'url'
        fields.

        For example, given config.txt containing:
          [testopia]
          login: jdoe@mycompany.com', 
          password: jdoepassword'
          url: https://myhost.mycompany.com/bugzilla/tr_xmlrpc.cgi

        we can write scripts that avoid embedding user credentials in the
        source code:
          t = Testopia.from_config('config.txt')
          print t.environment_list()
        """
        from ConfigParser import SafeConfigParser
        cp = SafeConfigParser()
        cp.read([filename])
        kwargs = dict([(key, cp.get('testopia', key)) \
                       for key in ['username', 'password', 'url']])
        return Testopia(**kwargs)
    
    def __init__(self, username, password, url):
        """Initialize the Testopia driver.

        'username' -- string, the account to log into Testopia such as jdoe@mycompany.com,
        'password' -- string, the password for the username,
        'url' -- string, the URL of the XML-RPC interface 

        Example: t = Testopia('jdoe@mycompany.com', 
                              'jdoepassword'
                              'https://myhost.mycompany.com/bugzilla/tr_xmlrpc.cgi')
        """
        if url.startswith('https://'):
            self._transport = SafeCookieTransport()
        elif url.startswith('http://'):
            self._transport = CookieTransport()
        else:
            raise "Unrecognized URL scheme"
        self._transport.cookiejar = CookieJar()
        # print "COOKIES:", self._transport.cookiejar._cookies
        self.server = xmlrpclib.ServerProxy(url,
                                            transport = self._transport,
                                            verbose = VERBOSE)


        # Login, get a cookie into our cookie jar:
        loginDict = self.do_command("User.login", [dict(login=username,
                                                        password=password)])
        # Record the user ID in case the script wants this
        self.userId = loginDict['id']
        # print 'Logged in with cookie for user %i' % self.userId
        # print "COOKIES:", self._transport.cookiejar._cookies

    def _boolean_option(self, option, value):
        """Returns the boolean option when value is True or False, else ''

        Example: _boolean_option('isactive', True) returns " 'isactive': 1,"
        """
        if value or str(value) == 'False':
            if type(value) is not BooleanType:
                raise TestopiaError("The value for the option '%s' is not of boolean type." % option)
            elif value == False:
                return "\'%s\':0, " % option
            elif value == True:
                return "\'%s\':1, " % option
        return ''


    def _datetime_option(self, option, value):
        """Returns the string 'option': 'value' where value is a date object formatted
        in string as yyyy-mm-dd hh:mm:ss. If value is None, then we return ''.

        Example: self._time_option('datetime', datetime(2007,12,05,13,01,03))
        returns "'datetime': '2007-12-05 13:01:03'"
        """
        if value:
            if type(value) is not type(datetime(2000,01,01,12,00,00)):
                raise TestopiaError("The option '%s' is not a valid datetime object." % option)
            return "\'%s\':\'%s\', " % (option, value.strftime("%Y-%m-%d %H:%M:%S"))
        return ''


    def _list_dictionary_option(self, option, value):
        """Verifies that the value passed for the option is in the format of a list
        of dictionaries.

        Example: _list_dictionary_option('plan':[{'key1': 'value1', 'key2': 'value2'}])
        verifies that value is a list, then verifies that the content of value are dictionaries.
        """
        if value: # Verify that value is a type of list
            if type(value) is not ListType: # Verify that the content of value are dictionaries,
                raise TestopiaError("The option '%s' is not a valid list of dictionaries." % option)
            else:
                for item in value:
                    if type(item) is not DictType:
                        raise TestopiaError("The option '%s' is not a valid list of dictionaries." % option)
            return "\'%s\': %s" % (option, value)
        return ''

    _list_dict_op = _list_dictionary_option


    def _number_option(self, option, value):
        """Returns the string " 'option': value," if value is not None, else ''

        Example: self._number_option("isactive", 1) returns " 'isactive': 1,"
        """
        if value:
            if type(value) is not IntType:
                raise TestopiaError("The option '%s' is not a valid integer." % option)
            return "\'%s\':%d, " % (option, value)
        return ''


    def _number_no_option(self, number):
        """Returns the number in number. Just a totally useless wrapper :-)

        Example: self._number_no_option(1) returns 1
        """
        if type(number) is not IntType:
            raise TestopiaError("The 'number' parameter is not an integer.")
        return str(number)

    _number_noop = _number_no_option


    def _options_dict(self, *args):
        """Creates a wrapper around all the options into a dictionary format.

        Example, if args is ['isactive': 1,", 'description', 'Voyage project'], then
        the return will be {'isactive': 1,", 'description', 'Voyage project'}
        """
        return "{%s}" % ''.join(args)


    def _options_non_empty_dict(self, *args):
        """Creates a wrapper around all the options into a dictionary format and
        verifies that the dictionary is not empty.

        Example, if args is ['isactive': 1,", 'description', 'Voyage project'], then
        the return will be {'isactive': 1,", 'description', 'Voyage project'}.
        If args is empty, then we raise an error.
        """
        if not args:
            raise TestopiaError, "At least one variable must be set."
        return "{%s}" % ''.join(args)

    _options_ne_dict = _options_non_empty_dict


    def _string_option(self, option, value):
        """Returns the string 'option': 'value'. If value is None, then ''

        Example: self._string_option('description', 'Voyage project') returns
        "'description' : 'Voyage project',"
        """
        if value:
            if type(value) is not StringType:
                raise TestopiaError("The option '%s' is not a valid string." % option)
            return "\'%s\':\'%s\', " % (option, value)
        return ''


    def _string_no_option(self, option):
        """Returns the string 'option'.

        Example: self._string_no_option("description") returns "'description'"
        """
        if option:
            if type(option) is not StringType:
                raise TestopiaError("The option '%s' is not a valid string." % option)
            return "\'%s\'" % option
        return ''

    _string_noop = _string_no_option


    def _time_option(self, option, value):
        """Returns the string 'option': 'value' where value is a time object formatted in string as hh:mm:ss.
        If value is None, then we return ''.

        Example: self._time_option('time', time(12,00,03)) returns "'time': '12:00:03'"
        """
        if value:
            if type(value) is not type(time(12,00,00)):
                raise TestopiaError("The option '%s' is not a valid time object." % option)
            return "\'%s\':\'%s\', " % (option, value.strftime("%H:%M:%S"))
        return ''


    def _validate_search_operation_string(self, option, operation):
        """Validates the operation passed is a valid search operation.

        'operation' -- string, valid search operations

        Valid Search Operations:
            'equals',
            'notequals',
            'isnull',
            'isnotnull',
            'lessthan',
            'greaterthan',
            'regexp',
            'notregexp',
            'anywords',
            'allwords',
            'nowords',
        """
        VALID_SEARCH_OPERATIONS = ['equals', 'notequals', 'isnull',
                'isnotnull', 'lessthan', 'greaterthan', 'regexp',
                'notregexp', 'anywords', 'allwords', 'nowords',]
        if operation:
            if operation not in VALID_SEARCH_OPERATIONS:
                raise TestopiaError("Not a valid search operation.")
            else:
                return "\'%s\':\'%s\', " % (option, operation)
        return ''

    _search_op = _validate_search_operation_string


    def do_command(self, verb, args):
        """Submit a command to the server proxy.

        'verb' -- string, the xmlrpc verb,
        'args' -- list, the argument list,
        """
        params = ''
        for arg in args:
            params = ("%s" % str(arg), "%s, %s" % (params, str(arg)))[params!='']
        cmd = "self.server." + verb + "(" + params + ")"
        if DEBUG:
            print cmd
        #from pprint import pprint
        #pprint(self.server._ServerProxy__transport.cookiejar._cookies)
        try:
            return eval(cmd)
        except xmlrpclib.Error, e:
            raise TestopiaXmlrpcError(verb, params, e)
        
    ############################## Build #######################################


    def build_get(self, build_id):
        """Get A Build by ID.

        'build_id' -- integer, Must be greater than 0

        Example: build_get(10)

        Result: A dictionary of key/value pairs for the attributes listed above
        """
        return self.do_command("Build.get", [self._number_noop(build_id)])


    def build_create(self, name, product_id, description=None, milestone=None,
                   isactive=None):
        """Create A New Build.

        'name' -- string, required value
        'product_id' -- integer, required value
        'description' -- string, optional
        'milestone' -- string, optional
        'isactive' -- boolean, optional

        Example: build_create(name='New Build', product_id=1)

        Result: An integer value representing the new build_id
        """
        return self.do_command("Build.create", [self._options_dict(
                   self._string_option("name", name),
                   self._number_option("product_id", product_id),
                   self._string_option("description", description),
                   self._string_option("milestone", milestone),
                   self._boolean_option("isactive", isactive)
                   )])


    def build_update(self, build_id, name=None, description=None, milestone=None,
                     isactive=None):
        """Update An Existing Build.

        'build_id' -- integer,
        'name' -- string, optional
        'description' -- string, optional
        'milestone' -- string, optional
        'isactive' -- boolean, optional

        Example: build_update(build_id = 10, product_id = 10, isactive = True)

        When updating, if the name is the same, build_update() will return an exists error.
        If the name is different, the name will be updated.

        Result: The modified Build on success

        Note: The 'isactive' attribute is not updating yet. Bugzilla #346907
        """
        return self.do_command("Build.update", [self._number_noop(build_id),
                   self._options_dict(
                   self._string_option("name", name),
                   self._string_option("description", description),
                   self._string_option("milestone", milestone),
                   self._boolean_option("isactive", isactive)
                   )])


    def build_lookup_id_by_name(self, name):
        """Lookup A Build ID By Its Name.

        'name' -- string, Cannot be null or empty string

        Example: build_lookup_id_by_name('12345')

        Result: The build id for the respective name or 0 if an error occurs.
        """
        return self.do_command("Build.lookup_id_by_name", [self._string_noop(name)])

    def build_check_by_name(self, name, product_id):
        return self.do_command("Build.check_build", [self._string_noop(name),
                                                     self._number_noop(product_id)])

    def build_lookup_name_by_id(self, id):
        """Lookup A Build Name By Its ID.

        'id' -- integer, Cannot be 0.

        Example: build_lookup_name_by_id(10)

        Result: The build name for the respective id or empty string if an error occurs.
        """
        return self.do_command("Build.lookup_name_by_id", [self._number_noop(id)])


    ############################## Environment ##################################


    def environment_get(self, environment_id):
        """Get An Environment by ID

        'environment_id' -- integer, Must be greater than 0

        Example: environment_get(10)

        Result: A dictionary of key/value pairs for the attributes listed above
        """
        return self.do_command("Environment.get", [self._number_noop(environment_id)])


    def environment_list(self, environment_id=None, environment_id_type=None,
                   isactive=None, isactive_type=None,
                   name=None, name_type=None,
                   product_id=None, product_id_type=None):
        """Get A List of Environments Based on A Query

        'query' -- dict,

        Example: environment_list({'product_id': 1, 'is_active': 1})

        Result: A list of Environment dictionaries
        """
        return self.do_command("Environment.list", [self._options_ne_dict(
                   self._number_option('environment_id', environment_id),
                   self._search_op('environment_id_type', environment_id_type),
                   self._boolean_option('isactive', isactive),
                   self._search_op('isactive_type', isactive_type),
                   self._string_option('name', name),
                   self._search_op('name_type', name_type),
                   self._number_option('product_id', product_id),
                   self._search_op('product_id', product_id_type),
                   self._boolean_option('viewall', self.view_all),
                   )])

    def environment_check_by_name(self, name, product_id):
        return self.do_command("Environment.check_environment", 
                                              [self._string_noop(name),
                                               self._number_noop(product_id)])

    def environment_create(self, product_id, isactive, name=None):
        """Create A New Environment

        'product_id' -- integer,
        'isactive' -- boolean,
        'name' -- string, optional

        Example: environment_create(1, True)

        Result: An integer value representing the new environment_id
        """
        return self.do_command("Environment.create", [self._options_dict(
                   self._number_option('product_id', product_id),
                   self._boolean_option('isactive', isactive),
                   self._string_option('name', name)
                   )])


    def environment_update(self, environment_id, name, product_id, isactive):
        """Update An Existing Environment.

        'environment_id' -- integer,
        'name' -- string
        'product_id' -- integer
        'isactive' -- boolean

        Example: environment_update(10, name='Updated Environment Name')

        Result: The modified environment on success
        """
        return self.do_command("Environment.update", [self._number_noop(environment_id),
                   self._options_dict(
                   self._string_option('name', name),
                   self._number_option('product_id', product_id),
                   self._boolean_option('isactive', isactive)
                   )])


    def environment_get_runs(self, environment_id):
        """Get A List of TestRuns For An Existing Environment

        'environment_id' -- integer,

        Example: environment_get_runs(10)

        Result: A list of TestRun objects on success
        """
        return self.do_command("Environment.get_runs", [self._number_noop(environment_id)])


    ############################## Product ##################################


    def product_lookup_id_by_name(self, name):
        """Lookup A Product ID By Its Name.

        'name' -- str, Cannot be null or empty string

        Example: product_lookup_id_by_name('Product Name')

        Result: The product id for the respective name.
        """
        # really ought to be using exceptions for error-handling
        prodDict = self.do_command('Product.check_product', [self._string_noop(name)])
        return prodDict['id']

    def product_check_by_name(self, name):
        return self.do_command("Product.check_product", [self._string_noop(name)])

    def product_lookup_name_by_id(self, id):
        """Lookup A Product Name By Its ID.

        'id' -- int, Cannot be 0

        Example: product_lookup_name_by_id(10)

        Result: The product name for the respective id or empty string if an error occurs.
        """
        return self.do_command("Product.lookup_name_by_id", [self._number_noop(id)])


    def product_get_milestones(self, product_id):
        """Get a list of milestones for the given Product.

        'product_id' -- int,

        Example: product_get_milestones(10)

        Result: A list of Milestone dictionaries
        """
        return self.do_command("Product.get_milestones", [self._number_noop(product_id)])


    ############################## Tag #######################################



    ############################## User ##################################

    def user_lookup_id_by_login(self, login):
        """Lookup A User ID By Its Login.

        'login' -- string, Cannot be null or empty string

        Example: user_lookup_id_by_login(login)

        Result: The user id for the respective login or 0 if an error occurs.
        """
        return self.do_command("User.lookup_id_by_login", [self._string_noop(login)])


    def user_lookup_login_by_id(self, id):
        """Lookup A Login By Its ID.

        'id' -- int, Cannot be 0

        Example: user_lookup_login_by_id(10)

        Result: The user login for the respective id or empty string if an error occurs.
        """
        return self.do_command("User.lookup_login_by_id", [self._number_noop(id)])


    ############################## TestPlan ##################################


    def testplan_get(self, plan_id):
        """Get A TestPlan by ID.

        'plan_id' -- integer, Must be greater than 0

        Example: testplan_get(10)

        Result: A dictionary of key/value pairs for the attributes listed above
        """
        return self.do_command("TestPlan.get", [self._number_noop(plan_id)])


    def testplan_list(self, plan_id=None, plan_id_type=None,
                   name=None, name_type=None,
                   type_id=None, type_id_type=None,
                   creation_date=None, creation_date_type=None,
                   default_product_version=None, default_product_version_type=None,
                   author_id=None, author_id_type=None,
                   isactive=None, isactive_type=None,
                   product_id=None, product_id_type=None):
        """Get A List of TestPlans Based on A Query.

        'plan_id' -- integer, Must be greater than 0
        'plan_id_type' -- string, valid search operation,
        'name' -- string,
        'name_type' -- string, valid search operation,
        'type_id' -- integer,
        'type_id_type' -- string, valid search operation,
        'creation_date' -- string,
        'creation_date_type' -- string, valid search operation,
        'default_product_version' -- string,
        'default_product_version_type' -- string, valid search operation,
        'author_id' -- integer,
        'author_id_type' -- string, valid search operation,
        'isactive' -- boolean,
        'isactive_type' -- string, valid search operation,
        'product_id' -- integer,
        'product_id_type' -- string, valid search operation,

        Example: testplan_list(plan_id=2, planidtype='lessthan')

        Result: A list of TestPlan dictionaries
        """
        return self.do_command("TestPlan.list", [self._options_ne_dict(
                   self._number_option('plan_id', plan_id),
                   self._search_op('planidtype', plan_id_type),
                   self._string_option('name', name),
                   self._search_op('name_type', name_type),
                   self._number_option('type_id', type_id),
                   self._search_op('type_id', type_id_type),
                   self._datetime_option('creation_date', creation_date),
                   self._search_op('creation_date_type', creation_date_type),
                   self._string_option('default_product_version', default_product_version),
                   self._search_op('default_product_version_type', default_product_version_type),
                   self._number_option('author_id', author_id),
                   self._search_op('author_id', author_id_type),
                   self._boolean_option('isactive', isactive),
                   self._search_op('isactive_type', isactive_type),
                   self._number_option('product_id', product_id),
                   self._search_op('product_id', product_id_type),
                   self._boolean_option('viewall', self.view_all),
                   )])


    def testplan_create(self, name, product_id, author_id, type_id, default_product_version, isactive=None):
        """Create A New TestPlan.

        'name' -- string,
        'product_id' -- integer,
        'author_id' -- integer,
        'type_id' -- integer,
        'default_product_version' -- string,
        'isactive' -- boolean, optional

        Example: testplan_create('New Plan', 1, 2, 2, '1.0')

        Result: An integer value representing the new plan_id
        """
        return self.do_command("TestPlan.create", [self._options_dict(
                   self._string_option('name', name),
                   self._number_option('product_id', product_id),
                   self._number_option('author_id', author_id),
                   self._number_option('type_id', type_id),
                   self._string_option('default_product_version', default_product_version),
                   self._boolean_option('isactive', isactive),
                   )])


    def testplan_update(self, plan_id, name, product_id, type_id, product_version, isactive):
        """Update An Existing TestPlan.

        'plan_id' -- integer,
        'name' -- string,
        'product_id' -- integer,
        'type_id' -- integer,
        'product_version' -- string,
        'isactive' -- boolean,

        Note: plan_id, author_id, and creation_date can not be modified.

        Example: testplan_update(796, name = 'Hello', product_id = 1, type_id = 5, product_version = 'BETA', isactive = True)

        Result: A list of Category objects on success
        """
        return self.do_command("TestPlan.update", [self._number_noop(plan_id),
                   self._options_dict(
                   self._string_option('name', name),
                   self._number_option('product_id', product_id),
                   self._number_option('type_id', type_id),
                   self._string_option('default_product_version', product_version),
                   self._boolean_option('isactive', isactive),
                   )])


    def testplan_get_categories(self, plan_id):
        """Get A List of Categories For An Existing Test Plan.

        'plan_id' -- integer, Must be greater than 0

        Example: testplan_get_categories(10)

        Result: A list of Category objects on success
        """
        return self.do_command("TestPlan.get_categories", [self._number_noop(plan_id)])


    def testplan_get_builds(self, plan_id):
        """Get A List of Builds For An Existing Test Plan.

        'plan_id' -- integer, Must be greater than 0

        Example: testplan_get_builds(10)

        Result: A list of Build objects on success
        """
        return self.do_command("TestPlan.get_builds", [self._number_noop(plan_id)])


    def testplan_get_components(self, plan_id):
        """Get A List of Components For An Existing Test Plan.

        'plan_id' -- integer, Must be greater than 0

        Example: testplan_get_components(10)

        Result: A list of Component objects on success
        """
        return self.do_command("TestPlan.get_components", [self._number_noop(plan_id)])


    def testplan_get_test_cases(self, plan_id):
        """Get A List of Test Cases For An Existing Test Plan.

        'plan_id' -- integer, Must be greater than 0

        Example: testplan_get_test_cases(10)

        Result: A list of TestCase objects on success
        """
        return self.do_command("TestPlan.get_test_cases", [self._number_noop(plan_id)])


    def testplan_get_test_runs(self, plan_id):
        """Get A List of Test Runs For An Existing Test Plan.

        'plan_id' -- integer, Must be greater than 0

        Example: testplan_get_test_runs(10)

        Result: A list of TestRun objects on success
        """
        return self.do_command("TestPlan.get_test_runs", [self._number_noop(plan_id)])


    def testplan_add_tag(self, plan_id, tag_name):
        """Get A List of Test Runs For An Existing Test Plan.

        'plan_id' -- integer, Must be greater than 0
        'tag_name' -- string, Creates tag if it does not exist

        Example: testplan_get_test_runs(10, 'New Tag')

        Result: The integer , 0, on success
        """
        return self.do_command("TestPlan.add_tag", [self._number_noop(plan_id),
                   self._string_noop(tag_name)
                   ])


    def testplan_remove_tag(self, plan_id, tag_name):
        """Get A List of Test Runs For An Existing Test Plan.

        'plan_id' -- integer, Must be greater than 0
        'tag_name' -- string, Creates tag if it does not exist

        Example: testplan_remove_tag(10, 'New Tag')

        Result: The integer , 0, on success
        """
        return self.do_command("TestPlan.remove_tag", [self._number_noop(plan_id),
                   self._string_noop(tag_name)
                   ])


    def testplan_get_tags(self, plan_id):
        """Get a list of tags for the given TestPlan.

        'plan_id' -- integer, Must be greater than 0

        Example: testplan_get_tags(10)

        Result: A list of Tag dictionaries
        """
        return self.do_command("TestPlan.get_tags", [self._number_noop(plan_id)])


    def testplan_lookup_type_id_by_name(self, name):
        """Lookup A TestPlan Type ID By Its Name.

        'name' -- string, Cannot be null or empty string

        Example: testplan_lookup_type_id_by_name('Unit')

        Result: The TestPlan type id for the respective name or 0 if an error occurs.
        """
        return self.do_command("TestPlan.lookup_type_id_by_name", [self._string_noop(name)])


    def testplan_lookup_type_name_by_id(self, id):
        """Lookup A TestPlan Type Name By Its ID.

        'id' -- integer, Cannot be 0

        Example: testplan_lookup_type_name_by_id(10)

        Result: The TestPlan type name for the respective id or empty string if an error occurs.
        """
        return self.do_command("TestPlan.lookup_type_name_by_id", [self._number_noop(id)])


    ############################## TestCase ##################################


    def testcase_get(self, case_id):
        """Get A TestCase by ID.

        'case_id' -- integer, Must be greater than 0

        Example: testcase_get(1)

        Result: A dictionary of key/value pairs for the attributes listed above
        """
        return self.do_command("TestCase.get", [self._number_noop(case_id)])


    def testcase_list(self, case_id=None, case_id_type=None,
                   alias=None, alias_type=None,
                   arguments=None, arguments_type=None,
                   author_id=None, author_id_type=None,
                   canview=None, canview_type=None,
                   case_status_id=None, case_status_id_type=None,
                   category_id=None, category_id_type=None,
                   creation_date=None, creation_date_type=None,
                   default_tester_id=None, default_tester_id_type=None,
                   isautomated=None, isautomated_type=None,
                   plans=None,
                   priority_id=None, priority_id_type=None,
                   requirement=None, requirement_type=None,
                   script=None, script_type=None,
                   sortkey=None, sortkey_type=None,
                   summary=None, summary_type=None,
                   estimated_time=None, estimated_time_type=None,
                   run_id=None, run_id_type=None):
        """Get A List of TestCases Based on A Query.

        'case_id' -- integer, optional,
        'case_id_type' -- valid search option, optional,
        'alias' -- string, optional,
        'alias_type -- valid search option, optional,
        'arguments' -- string, optional,
        'arguments_type' -- valid search option, optional,
        'author_id' -- integer, optional,
        'author_id_type' -- valid search option, optional,
        'canview' -- integer, optional,
        'canview_type' -- valid search option, optional,
        'case_status_id' -- integer, optional,
        'case_status_id_type' -- valid search option, optional,
        'category_id' -- integer, optional,
        'category_id_type' -- valid search option, optional,
        'creation_date' -- string, Format: yyyy-mm-dd  hh:mm:ss
        'creation_date_type' -- valid search option, optional,
        'default_tester_id' -- integer, optional,
        'default_tester_id_type' -- valid search option, optional,
        'isautomated' -- boolean, optional,
        'isautomated_type' -- valid search option, optional,
        'plans'-- List of TestPlan dictionaries
        'priority_id' -- integer, optional,
        'priority_id_type' -- valid search option, optional,
        'requirement' -- string, optional,
        'requirement_type' -- valid search option, optional,
        'script' -- string, optional,
        'script_type' - valid search option, optional,
        'summary' -- string, optional,
        'summary_type' -- valid search option, optional,
        'sortkey' -- integer, optional,
        'sortkey_type' -- valid search optional, optional,
        'estimated_time' -- string, Format: hh:mm:ss, optional,
        'estimated_time_type' -- valid search option, optional,
        'run_id' -- integer, optional,
        'run_id_type' -- valid search option, optional,

        Example: testcase_list(case_id=20, case_id_type='lessthan')

        Result: A list of TestCase dictionaries
        """
        return self.do_command("TestCase.list", [self._options_ne_dict(
                   self._number_option('case_id', case_id),
                   self._search_op('caseidtype', case_id_type),
                   self._string_option('alias', alias),
                   self._search_op('alias_type', alias_type),
                   self._string_option('arguments', arguments),
                   self._search_op('arguments_type', arguments_type),
                   self._number_option('author_id', author_id),
                   self._search_op('author_id_type', author_id_type),
                   self._number_option('canview', canview),
                   self._search_op('canview_type', canview_type),
                   self._number_option('case_status_id', case_status_id),
                   self._search_op('case_status_id_type', case_status_id_type),
                   self._number_option('category_id', category_id),
                   self._search_op('category_id_type', category_id_type),
                   self._datetime_option('creation_date', creation_date),
                   self._search_op('creation_date_type', creation_date_type),
                   self._number_option('default_tester_id', default_tester_id),
                   self._search_op('default_tester_id_type', default_tester_id_type),
                   self._boolean_option('isautomated', isautomated),
                   self._search_op('isautomated_type', isautomated_type),
                   self._list_dict_op('plans', plans),
                   self._number_option('priority_id', priority_id),
                   self._search_op('priority_id_type', priority_id_type),
                   self._string_option('requirement', requirement),
                   self._search_op('requirement_type', requirement_type),
                   self._string_option('script', script),
                   self._search_op('script_type', script_type),
                   self._string_option('summary', summary),
                   self._search_op('summary_type', summary_type),
                   self._number_option('sortkey', sortkey),
                   self._search_op('sortkey_type', sortkey_type),
                   self._time_option('estimated_time', estimated_time),
                   self._search_op('estimated_time_type', estimated_time_type),
                   self._number_option('run_id', run_id),
                   self._search_op('runidtype', run_id_type),
                   self._boolean_option('viewall', self.view_all),
                   )])


    def testcase_create(self, summary, plan_id, author_id, isautomated, category_id, case_status_id,
                        alias=None, arguments=None, default_tester_id=None, priority_id=None,
                        requirement=None, script=None, sortkey=None, estimated_time=None):
        """Create A New TestCase.

        'summary' -- string,
        'plan_id' -- integer,
        'author_id' -- integer,
        'isautomated' -- boolean,
        'category_id' -- integer,
        'case_status_id' -- integer,
        'alias' -- string, optional,
        'arguments' -- string, optional,
        'default_tester_id' -- integer, optional,
        'priority_id' -- integer, optional,
        'requirement' -- string, optional,
        'script' -- string, optional,
        'sortkey' -- integer, optional,
        'estimated_time' -- string, Format: hh:mm:ss, optional

        Example: testcase_create('Summary', 1, 1, 0, 1, 2)

        Result: An integer value representing the new case_id
        """
        return self.do_command("TestCase.create", [self._options_dict(
                   self._string_option('summary', summary),
                   self._number_option('plan_id', plan_id),
                   self._number_option('author_id', author_id),
                   self._boolean_option('isautomated', isautomated),
                   self._number_option('category_id', category_id),
                   self._number_option('case_status_id', case_status_id),
                   self._string_option('alias', alias),
                   self._string_option('arguments', arguments),
                   self._number_option('default_tester_id', default_tester_id),
                   self._number_option('priority_id', priority_id),
                   self._string_option('requirement', requirement),
                   self._string_option('script', script),
                   self._number_option('sortkey', sortkey),
                   self._string_option('estimated_time', estimated_time),
                   )])


    def testcase_update(self, case_id, summary=None, isautomated=None,
                   category_id=None, case_status_id=None,
                   alias=None, arguments=None, priority_id=None,
                   requirement=None, script=None,
                   sortkey=None, estimated_time=None):
        """Update An Existing TestCase.

        'case_id' -- integer,
        'summary' -- string, optional
        'isautomated' -- boolean, optional
        'category_id' -- integer, optional
        'case_status_id' -- integer, optional
        'alias' -- string, optional,
        'arguments' -- string, optional,
        'priority_id' -- integer, optional,
        'requirement' -- string, optional,
        'script' -- string, optional,
        'sortkey' -- integer, optional,
        'estimated_time' -- string, Format: hh:mm:ss, optional

        Example: testcase_update(20, summary="Updated Summary")

        Result: The modified TestCase on success
        """
        return self.do_command("TestCase.update", [self._options_dict(
                   self._number_option('case_id', case_id),
                   self._string_option('summary', summary),
                   self._boolean_option('isautomated', isautomated),
                   self._number_option('category_id', category_id),
                   self._number_option('case_status_id', case_status_id),
                   self._string_option('alias', alias),
                   self._string_option('arguments', arguments),
                   self._number_option('priority_id', priority_id),
                   self._string_option('requirement', requirement),
                   self._string_option('script', script),
                   self._number_option('sortkey', sortkey),
                   self._string_option('estimated_time', estimated_time),
                   )])


    def testcase_get_text(self, case_id):
        """Get TestCase's Current Action/Effect Document.

        'case_id' -- integer,

        Example: testcase_get_text(1)

        Result: A dictionary of key/value pairs for the attributes of a TestCase document
        Attributes of a TestCase document are action, author, effect, and version.
        """
        return self.do_command("TestCase.get_text", [self._number_noop(case_id)])


    def testcase_store_text(self, case_id, author_id, setup=None, breakdown=None,
                   action=None, expected_results=None):
        """Add A New TestCase Action/Effect Document.

        setup, breakdown, action, expected
        'case_id' -- integer,
        'author_id' -- integer,
        'setup' -- string, optional
        'breakdown' -- string, optional
        'action' -- string, optional
        'expected_results' -- string, optional

        Example: testcase_store_text(1, 1, 'New Setup', 'New Breakdown', 'New Action', '
        New Expected results')

        Result: The new document version on success
        """
        return self.do_command("TestCase.store_text", [self._number_noop(case_id), # This is the proper order
                   self._number_noop(author_id),
                   self._string_noop(action),
                   self._string_noop(expected_results),
                   self._string_noop(setup),
                   self._string_noop(breakdown)
                   ])


    def testcase_get_bugs(self, case_id):
        """Get a list of bugs for the given TestCase.

        'case_id' -- integer,

        Example: testcase_get_bugs(1)

        Result: A list of Bug dictionaries
        """
        return self.do_command("TestCase.get_bugs", [self._number_noop(case_id)])


    def testcase_add_component(self, case_id, component_id):
        """Add a component to the given TestCase.

        'case_id' -- integer,
        'component_id' -- integer,

        Example: testcase_add_component(1, 2)

        Result: The integer , 0, on success
        """
        return self.do_command("TestCase.add_component", [self._number_noop(case_id),
                   self._number_noop(component_id)])


    def testcase_remove_component(self, case_id, component_id):
        """Remove a component from the given TestCase.

        'case_id' -- integer,
        'component_id' -- integer,

        Example: testcase_remove_component(1, 2)

        Result: The integer , 0, on success
        """
        return self.do_command("TestCase.remove_component", [self._number_noop(case_id),
                   self._number_noop(component_id)])


    def testcase_get_components(self, case_id):
        """Get a list of components for the given TestCase.

        'case_id' -- integer,

        Example: testcase_get_components(1)

        Result: A list of Component dictionaries
        """
        return self.do_command("TestCase.get_components", [self._number_noop(case_id)])


    def testcase_add_tag(self, case_id, tag_name):
        """Add a tag to the given TestCase.

        'plan_id' -- integer, Must be greater than 0
        'tag_name' -- string, Creates tag if it does not exist

        Example: testcase_add_tag(10, 'New Tag')

        Result: The integer , 0, on success
        """
        return self.do_command("TestCase.add_tag", [self._number_noop(case_id),
                   self._string_noop(tag_name)])


    def testcase_remove_tag(self, case_id, tag_name):
        """Remove a tag from the given TestCase.

        'plan_id' -- integer,
        'tag_name' -- string,

        Example: testcase_remove_tag(10, 'Old Tag')

        Result: The integer , 0, on success
        """
        return self.do_command("TestCase.remove_tag", [self._number_noop(case_id),
                   self._string_noop(tag_name)])


    def testcase_get_tags(self, case_id):
        """Get a list of tags for the given TestCase.

        'case_id' -- integer,

        Example: testcase_get_tags(10)

        Result: A list of Tag dictionaries
        """
        return self.do_command("TestCase.get_tags", [self._number_noop(case_id)])


    def testcase_get_plans(self, case_id):
        """Get a list of tags for the given TestCase.

        'case_id' -- integer,

        Example: testcase_get_tags(10)

        Result: A list of TestPlan dictionaries
        """
        return self.do_command("TestCase.get_plans", [self._number_noop(case_id)])


    def testcase_lookup_category_id_by_name(self, name):
        """Lookup A TestCase Category ID By Its Name.

        'name' -- string, Cannot be null or empty string

        Example: testcase_lookup_category_id_by_name('Name')

        Result: The TestCase category id for the respective name or 0 if an error occurs.
        """
        return self.do_command("TestCase.lookup_category_id_by_name", [self._string_noop(name)])


    def testcase_lookup_category_name_by_id(self, id):
        """Lookup A TestCase Category Name By Its ID.

        id -- integer, Cannot be 0,

        Example: testcase_lookup_category_name_by_id(10)

        Result: The TestCase category name for the respective id or empty string
        if an error occurs.
        """
        return self.do_command("TestCase.lookup_category_name_by_id", [self._number_noop(id)])


    def testcase_lookup_priority_id_by_name(self, name):
        """Lookup A TestCase Priority ID By Its Name.

        'name' -- string, Cannot be null or empty string

        Example: testcase_lookup_priority_id_by_name('Name')

        Result: The TestCase priority id for the respective name or 0 if an error occurs.
        """
        return self.do_command("TestCase.lookup_priority_id_by_name", [self._string_noop(name)])


    def testcase_lookup_priority_name_by_id(self, id):
        """Lookup A TestCase Category Name By Its ID.

        id -- integer, Cannot be 0,

        Example: testcase_lookup_priority_name_by_id(10)

        Result: The TestCase priority name for the respective id or empty string
        if an error occurs.
        """
        return self.do_command("TestCase.lookup_priority_name_by_id", [self._number_noop(id)])


    def testcase_lookup_status_id_by_name(self, name):
        """Lookup A TestCase Status ID By Its Name.

        'name' -- string, Cannot be null or empty string

        Example: testcase_lookup_status_id_by_name('Name')

        Result: The TestCase status id for the respective name or 0 if an error occurs.
        """
        return self.do_command("TestCase.lookup_status_id_by_name", [self._string_noop(name)])


    def testcase_lookup_status_name_by_id(self, id):
        """Lookup A TestCase Category Name By Its ID.

        id -- integer, Cannot be 0,

        Example: testcase_lookup_status_name_by_id(10)

        Result: The TestCase status name for the respective id or empty string
        if an error occurs.
        """
        return self.do_command("TestCase.lookup_status_name_by_id", [self._number_noop(id)])


    def testcase_link_plan(self, case_id, plan_id):
        """Link A TestPlan To An Existing TestCase.

        'case_id' -- integer,
        'plan_id' -- integer,

        Example: testcase_link_plan(10)

        Result: A list of TestPlan dictionaries
        """
        return self.do_command("TestCase.link_plan", [self._number_noop(case_id),
                   self._number_noop(plan_id)
                   ])


    def testcase_unlink_plan(self, case_id, plan_id):
        """Unlink A TestPlan From An Existing TestCase.

        'case_id' -- integer,
        'plan_id' -- integer,

        Example: testcase_unlink_plan(10)

        Result: A list of TestPlan dictionaries
        """
        return self.do_command("TestCase.unlink_plan", [self._number_noop(case_id),
                   self._number_noop(plan_id)])


    ############################## TestRun ##################################


    def testrun_get(self, run_id):
        """Get A TestRun by ID.

        'run_id' -- integer, Must be greater than 0.

        Example: testrun_get(10)

        Result: A dictionary of key/value pairs for the attributes listed above
        """
        return self.do_command("TestRun.get", [self._number_noop(run_id)])


    def testrun_list(self, run_id=None, run_id_type=None,
                   build_id=None, build_id_type=None,
                   environment_id=None, environment_id_type=None,
                   manager_id=None, manager_id_type=None,
                   notes=None, notes_type=None,
                   plan=None, plan_type=None,
                   plan_id=None, plan_id_type=None,
                   plan_text_version=None, plan_text_version_type=None,
                   product_version=None, product_version_type=None,
                   start_date=None, start_date_type=None,
                   stop_date=None, stop_date_type=None,
                   summary=None, summary_type=None):
        """Get A List of TestRuns Based on A Query.

        'run_id' -- integer, optional
        'run_id_type' -- valid search option, optional,
        'build_id' -- integer, optional
        'build_id_type' -- valid search option, optional,
        'environment_id' -- integer, optional
        'environment_id_type' -- valid search option, optional,
        'manager_id' -- integer, optional
        'manager_id_type' -- valid search option, optional,
        'notes' -- string, optional
        'notes_type' -- valid search option, optional,
        'plan' -- dictionary of TestPlan, optional
        'plan_id' -- integer, optional
        'plan_id_type' -- valid search option, optional,
        'plan_text_version' -- integer, optional
        'plan_text_version_type' -- valid search option, optional,
        'product_version' -- integer, optional
        'product_version_type' -- valid search option, optional,
        'start_date' -- string, Format: yyyy-mm-dd hh:mm:ss
        'start_date_type' -- valid search option, optional,
        'stop_date' -- string, Format: yyyy-mm-dd hh:mm:ss
        'stop_date_type' -- valid search option, optional,
        'summary' -- string, optional
        'summary_type' -- valid search option, optional,

        Example: testrun_list(run_id=20, run_id_type='lessthan')

        Result: A list of TestCase dictionaries
        """
        return self.do_command("TestCase.list", [self._options_ne_dict(
                   self._number_option('run_id', run_id),
                   self._search_op('runid_type', run_id_type),
                   self._number_option('build_id', build_id),
                   self._search_op('build_id_type', build_id_type),
                   self._number_option('environment_id', environment_id),
                   self._search_op('environment_id_type', environment_id_type),
                   self._number_option('manager_id', manager_id),
                   self._search_op('manager_id_type', manager_id_type),
                   self._string_option('notes', notes),
                   self._search_op('notes_type', notes_type),
                   self._list_dict_op('plan', plan),
                   self._number_option('plan_id', plan_id),
                   self._search_op('planid_type', plan_id_type),
                   self._string_option('plan_text_version', plan_text_version),
                   self._search_op('plan_text_version_type', plan_text_version_type),
                   self._number_option('product_version', product_version),
                   self._search_op('product_version_type', product_version_type),
                   self._datetime_option('start_date', start_date),
                   self._search_op('start_date_type', start_date_type),
                   self._datetime_option('stop_date', stop_date),
                   self._search_op('stop_date_type', stop_date_type),
                   self._string_option('summary', summary),
                   self._search_op('summary_type', summary_type),
                   self._boolean_option('viewall', self.view_all),
                   )])


    def testrun_create(self, build_id, environment_id,
                   plan_id, summary, manager_id, plan_text_version=0,
                   notes=None, product_version='unspecified'):
        """Create A New TestRun.

        'build_id' -- integer, optional
        'environment_id' -- integer, optional
        'manager_id' -- integer, optional
        'plan_id' -- integer, optional
        'plan_text_version' -- integer, optional
        'summary' -- string, optional
        'notes' -- string, optional
        'product_version' -- integer, optional

        Example: testrun_create(1, 1, 1, 1, 'Summary')

        Result: An integer value representing the new run_id
        """
        return self.do_command("TestRun.create", [self._options_dict(
                   self._number_option('build_id', build_id),
                   self._number_option('environment_id', environment_id),
                   self._number_option('manager_id', manager_id),
                   self._number_option('plan_id', plan_id),
                   self._number_option('plan_text_version', plan_text_version),
                   self._string_option('summary', summary),
                   self._string_option('notes', notes),
                   self._string_option('product_version', product_version),
                   )])


    def testrun_update(self, run_id, status_id,build_id=None, 
                   environment_id=None,
                   manager_id=None, plan_text_version=None, summary=None,
                   notes=None, product_version=None, stop_date=None):
        """Update An Existing TestRun.

        'run_id' -- integer,
        'build_id' -- integer, optional
        'environment_id' -- integer, optional
        'manager_id' -- integer, optional
        'plan_text_version' -- integer, optional
        'summary' -- string, optional
        'notes' -- string, optional
        'product_version' -- integer, optional

        Example: testrun_create(1, 1, 1, 1, 'Summary')

        Result: The modified TestRun on success
        """
        return self.do_command("TestRun.update", [run_id, self._options_dict(
                   self._number_option('build_id', build_id),
                   self._number_option('environment_id', environment_id),
                   self._number_option('manager_id', manager_id),
                   self._number_option('plan_text_version', plan_text_version),
                   self._string_option('notes', notes),
                   self._number_option('product_version', product_version),
                   self._number_option('status', status_id),
                   self._datetime_option('stop_date', stop_date),
                   )])


    def testrun_get_test_cases(self, run_id):
        """Get A List of TestCases For An Existing Test Run.

        'run_id' -- integer,

        Example: testrun_get_test_cases(10)

        Result: A list of TestCase objects on success
        """
        return self.do_command("TestRun.get_test_cases", [self._number_noop(run_id)])


    def testrun_get_test_case_runs(self, run_id):
        """Get A List of TestCase Runs For An Existing Test Run.

        'run_id' -- integer,

        Example: testrun_get_test_case_runs(10)

        Result: A list of TestCaseRun objects on success
        """
        return self.do_command("TestRun.get_test_case_runs", [self._number_noop(run_id)])


    def testrun_get_test_plan(self, run_id):
        """Get A TestPlan For An Existing Test Run.

        'run_id' -- integer,

        Example: testrun_get_plan(10)

        Result: A TestPlan object on success
        """
        return self.do_command("TestRun.get_test_plan", [self._number_noop(run_id)])


    def testrun_add_tag(self, run_id, tag_name):
        """Add a tag to the given TestRun.

        'run_id' -- integer,
        'tag_name' -- string, Creates tag if it does not exist,

        Example: testrun_add_tag(10, "Tag")

        Result: The integer , 0, on success
        """
        return self.do_command("TestRun.add_tag", [self._number_noop(run_id),
                   self._string_noop(tag_name)
                   ])


    def testrun_remove_tag(self, run_id, tag_name):
        """Remove a tag from the given TestRun.

        'run_id' -- integer,
        'tag_name' -- string,

        Example: testrun_remove_tag(10, "Tag")

        Result: The integer , 0, on success
        """
        return self.do_command("TestRun.remove_tag", [self._number_noop(run_id),
                   self._string_noop(tag_name)
                   ])


    def testrun_get_tags(self, run_id):
        """Get a list of tags for the given TestRun.

        'run_id' -- integer,

        Example: testrun_get_tags(10)

        Result: A list of Tag dictionaries
        """
        return self.do_command("TestRun.get_tags", [self._number_noop(run_id)])


    def testrun_lookup_environment_id_by_name(self, name):
        """Lookup A TestRun Environment ID By Its Name.

        'name' -- string,

        Example: testrun_lookup_environment_id_by_name("Name")

        Result: The TestRun environment id for the respective name or 0 if an error occurs.
        """
        return self.do_command("TestRun.lookup_environment_id_by_name", [self._string_noop(name)])


    def testrun_lookup_environment_name_by_id(self, id):
        """Lookup A TestRun Environment Name By Its ID.

        'id' -- integer, Cannot be 0

        Example: testrun_lookup_environment_name_by_id(10)

        Result: The TestRun environment name for the respective id or empty string if an error occurs.
        """
        return self.do_command("TestRun.lookup_environment_name_by_id", [self._number_noop(id)])


    ############################## TestCaseRun ##################################


    def testcaserun_get(self, case_run_id):
        """Get A TestCaseRun by ID.

        'case_run_id' -- integer, Must be greater than 0.

        Example: testcaserun_get(10)

        Result: A dictionary of key/value pairs for the attributes listed above on success;
        on error, an XmlRpcException is thrown.
        """
        return self.do_command("TestCaseRun.get", [self._number_noop(case_run_id)])


    def testcaserun_list(self, run_id=None, run_id_type=None,
                   assignee=None, assignee_type=None,
                   build_id=None, build_id_type=None,
                   canview=None, canview_type=None,
                   case_id=None, case_id_type=None,
                   case_run_id=None, case_run_id_type=None,
                   case_run_status_id=None, case_run_status_id_type=None,
                   case_text_version=None, case_text_version_type=None,
                   close_date=None, close_date_type=None,
                   environment_id=None, environment_id_type=None,
                   iscurrent=None, iscurrent_type=None,
                   notes=None, notes_type=None,
                   sortkey=None, sortkey_type=None,
                   testedby=None, testedby_type=None):
        """Get A List of TestCaseRuns Based on A Query.

        'run_id' -- integer, optional
        'run_id_type' -- valid search option, optional,
        'assignee' -- integer, optional
        'assignee_type' -- valid search option, optional,
        'build_id' -- integer, optional
        'build_id_type' -- valid search option, optional,
        'canview' -- integer, optional
        'canview_type' -- valid search option, optional,
        'case_id' -- integer, optional
        'case_id_type' -- valid search option, optional,
        'case_run_id' -- integer, optional
        'case_run_id_type' -- valid search option, optional,
        'case_run_status_id' -- integer, optional
        'case_run_status_id_type' -- valid search option, optional,
        'case_text_version' -- integer, optional
        'case_text_version_type' -- valid search option, optional,
        'close_date' -- string, Format: yyyy-mm-dd hh:mm:ss, optional
        'close_date_type' -- valid search option, optional,
        'environment_id' -- integer, optional
        'environment_id_type' -- valid search option, optional,
        'iscurrent' -- boolean, optional
        'iscurrent_type' -- valid search option, optional,
        'notes' -- string, optional
        'notes_type' -- valid search option, optional,
        'sortkey' -- integer, optional
        'sortkey_type' -- valid search option, optional,
        'testedby' -- integer, ID value, optional
        'testedby_type' -- valid search option, optional,

        Example: testcaserun_list(run=1)

        Result: A list of TestCaseRun dictionaries or a dictionary containing values for
        the keys on success; on error, an XmlRpcException is thrown.
        """
        return self.do_command("TestCaseRun.list", [self._options_ne_dict(
                   self._number_option('run_id', run_id),
                   self._search_op('runid_type', run_id_type),
                   self._number_option('assignee', assignee),
                   self._search_op('assignee_type', assignee_type),
                   self._number_option('build_id', build_id),
                   self._search_op('build_id_type', build_id_type),
                   self._number_option('canview', canview),
                   self._search_op('canview_type', canview_type),
                   self._number_option('case_id', case_id),
                   self._search_op('caseid_type', case_id_type),
                   self._number_option('case_run_id', case_run_id),
                   self._search_op('case_run_id_type', case_run_id_type),
                   self._number_option('case_run_status_id', case_run_status_id),
                   self._search_op('case_run_status_id_type', case_run_status_id_type),
                   self._number_option('case_text_version', case_text_version),
                   self._search_op('case_text_version_type', case_text_version_type),
                   self._datetime_option('close_date', close_date),
                   self._search_op('close_date_type', close_date_type),
                   self._number_option('environment_id', environment_id),
                   self._search_op('environment_id_type', environment_id_type),
                   self._boolean_option('iscurrent', iscurrent),
                   self._search_op('iscurrent_type', iscurrent_type),
                   self._string_option('notes', notes),
                   self._search_op('notes_type', notes_type),
                   self._number_option('sortkey', sortkey),
                   self._search_op('sortkey_type', sortkey_type),
                   self._number_option('testedby', testedby),
                   self._search_op('testedby_type', testedby_type),
                   self._boolean_option('viewall', self.view_all),
                   )])


    def testcaserun_create(self, assignee, build_id, case_id,
                           environment_id, run_id, case_text_version=None, notes=None):
        """Create A New TestCaseRun.

        'assignee' -- integer,
        'build_id' -- integer,
        'case_id' -- integer,
        'case_text_version' -- integer,
        'environment_id' -- integer,
        'run_id', integer,
        'notes' -- string, optional

        Example: testcaserun_create(1, 1, 1, 1, 1)

        Result: An integer value representing the new test case run id on success;
        on error, an XmlRpcException is thrown.
        """
        return self.do_command("TestCaseRun.create", [self._options_dict(
                   self._number_option('assignee', assignee),
                   self._number_option('build_id', build_id),
                   self._number_option('case_id', case_id),
                   self._number_option('case_text_version', case_text_version),
                   self._number_option('environment_id', environment_id),
                   self._number_option('run_id', run_id),
                   self._string_option('notes', notes),
                   )])


    def testcaserun_update(self, run_id, case_id, build_id, environment_id,
                    new_build_id=None,
                    new_environment_id=None,
                    case_run_status_id=None,
                    update_bugs=False,
                    assignee=None,
                    notes=None):
        """Create A New TestCaseRun.

        'run_id', integer,
        'case_id' -- integer,
        'build_id' -- integer,
        'environment_id' -- integer,
        'new_build_id' -- integer,
        'new_environment_id' -- integer,
        'case_run_status_id' -- integer, the id of the case status, optional
        'update_bugs' -- boolean, optional
        'assignee' -- integer, the id of the user, optional
        'notes' -- string, optional,

        Example: testcaserun_update(1, 1, 1, 1, 1)

        Result: The modified TestCaseRun on success; on failure, an XmlRpcException is thrown.

        Notes: When setting the case_run_status_id to 2 (PASS), the 'Tested by' is updated
        to the user hat is currently logged in.
        """
        return self.do_command("TestCaseRun.update", [
                   self._number_noop(run_id),
                   self._number_noop(case_id),
                   self._number_noop(build_id),
                   self._number_noop(environment_id),
                   self._options_dict(
                   self._number_option('build_id', new_build_id),
                   self._number_option('environment_id', new_environment_id),
                   self._number_option('case_run_status_id', case_run_status_id),
                   self._boolean_option('update_bugs', update_bugs),
                   self._number_option('assignee', assignee),
                   self._string_option('notes', notes),
                   )])


    def testcaserun_get_bugs(self, case_run_id):
        """Get a list of bugs for the given TestCaseRun.

        'case_run_id' -- integer, Must be greater than 0.

        Example: testcaserun_get_bugs(10)

        Result: A list of Bug dictionaries or a dictionary containing values for the keys on success;
        on error, an XmlRpcException is thrown.
        """
        return self.do_command("TestCaseRun.get_bugs", [self._number_noop(case_run_id)])


    def testcaserun_lookup_status_id_by_name(self, name):
        """Lookup A TestCaseRun Status ID By Its Name.

        'name' -- string, Cannot be null or empty string

        Example: testcaserun_lookup_status_id_by_name("Name")

        Result: A list of Bug dictionaries or a dictionary containing values for the keys on success;
        on error, an XmlRpcException is thrown.
        """
        return self.do_command("TestCaseRun.lookup_status_id_by_name", [self._string_noop(name)])


    def testcaserun_lookup_status_name_by_id(self, id):
        """Lookup A TestCaseRun Status Name By Its ID.

        'id' -- integer, Cannot be 0

        Example: testcaserun_lookup_status_name_by_id(10)

        Result: The TestCaseRun status name for the respective id or 0 error occurs.
        """
        return self.do_command("TestCaseRun.lookup_status_name_by_id", [self._number_noop(id)])



# A simple pyunit test suite follows:
import unittest

class TestopiaUnitTest(unittest.TestCase):
    def setUp(self):
        self.testopia = Testopia.from_config('unittest.cfg')

        # these will have to reflect the data on whatever instance you're
        # running the tests against:
        self.testProductName = 'Rawhide'
        self.testEnvironmentName = 'i386'
        self.testBuildName = 'rawhide-20080624'

    def assert_is_int(self, value):
        self.assertEquals(type(value), type(42))

    def get_test_product_id(self):
        return self.testopia.product_check_by_name(self.testProductName)['id']

class LoginUnitTests(TestopiaUnitTest):
    def test_login(self):
        # Ensure that we logged in, and that we have our userId recorded:
        self.assert_(self.testopia is not None)        
        self.assert_(self.testopia.userId>0)

    def test_bogus_call(self):
        self.assertRaises(TestopiaXmlrpcError,
                          self.testopia.do_command,
                          "ThisIsNotAClass.this_is_not_a_method", [])

class BuildUnitTests(TestopiaUnitTest):
    def test_build_get(self):
        buildId = 1
        buildDict = self.testopia.build_get(buildId)
        self.assertEquals(buildDict['build_id'], buildId)
        self.assert_('product_id' in buildDict)
        # etc
        
    """API entry points that aren't yet covered:
    def build_create(self, name, product_id, description=None, milestone=None,
                   isactive=None)
    def build_update(self, build_id, name=None, description=None, milestone=None,
                     isactive=None)
    """
    def test_build_check_by_name(self):
        productId = self.get_test_product_id()
        buildDict = self.testopia.build_check_by_name(self.testBuildName, productId)
        self.assertEquals(buildDict['product_id'], productId)

    """
    def build_lookup_name_by_id(self, id)
    """
        
class EnvironmentUnitTests(TestopiaUnitTest):
    def test_environment_get(self):
        envId = 1
        envDict = self.testopia.environment_get(envId)
        self.assertEquals(envDict['environment_id'], envId)
        self.assert_('product_id' in envDict)
        self.assert_('isactive' in envDict)
        self.assert_('name' in envDict)

    def test_environment_list(self):
        envList = self.testopia.environment_list()
        self.assertEquals(type(envList), type([]))
        envDict = envList[0] 
        self.assert_('environment_id' in envDict)
        self.assert_('product_id' in envDict)
        self.assert_('isactive' in envDict)
        self.assert_('name' in envDict)
        # etc


    """API entry points that aren't yet covered:
    def environment_get(self, environment_id)
    def environment_list(self, environment_id=None, environment_id_type=None,
                   isactive=None, isactive_type=None,
                   name=None, name_type=None,
                   product_id=None, product_id_type=None)
    """
    def test_environment_check_by_name(self):
        productId = self.get_test_product_id()
        envDict = self.testopia.environment_check_by_name(self.testEnvironmentName, productId)
        self.assertEquals(envDict['product_id'], productId)
    """
    def environment_create(self, product_id, isactive, name=None)
    def environment_update(self, environment_id, name, product_id, isactive)
    def environment_get_runs(self, environment_id)
    """
    def test_environment_get_runs(self):
        envId = 1
        runList = self.testopia.environment_get_runs(envId)
        self.assertEquals(type(runList), type([]))
        runDict = runList[0]
        self.assert_('run_id' in runDict)
        self.assertEquals(runDict['environment_id'], envId)
        self.assert_('build_id' in runDict)
        self.assert_('plan_id' in runDict)
        self.assert_('start_date' in runDict)
        self.assert_('stop_date' in runDict)
        self.assert_('product_version' in runDict)
        self.assert_('summary' in runDict)
        self.assert_('manager_id' in runDict)
        self.assert_('plan_text_version' in runDict)
        self.assert_('notes' in runDict)


class ProductUnitTests(TestopiaUnitTest):
    def test_product_lookup_id_by_name(self):
        productId = self.testopia.product_lookup_id_by_name(self.testProductName)
        self.assert_is_int(productId)
        
    def test_product_check_by_name(self):
        productDict = self.testopia.product_check_by_name(self.testProductName)
        self.assertEquals(productDict['name'], self.testProductName)
        self.assert_('classification_id' in productDict)
        self.assert_('defaultmilestone' in productDict)
        self.assert_('description' in productDict)
        self.assert_('disallownew' in productDict)
        self.assert_('id' in productDict)
        self.assert_('maxvotesperbug' in productDict)
        self.assert_('milestoneurl' in productDict)
        self.assert_('votesperuser' in productDict)
        self.assert_('votestoconfirm' in productDict)
    """API entry points that aren't yet covered:
    def product_lookup_name_by_id(self, id)

    def product_get_milestones(self, product_id)
    """

class TagUnitTests(TestopiaUnitTest):
    """API entry points that aren't yet covered:
    (none yet)
    """

class UserUnitTests(TestopiaUnitTest):
    """API entry points that aren't yet covered:
    def user_lookup_id_by_login(self, login)
    def user_lookup_login_by_id(self, id)
    """

class TestPlanTests(TestopiaUnitTest):
    """API entry points that aren't yet covered:
    def testplan_get(self, plan_id)
    def testplan_list(self, plan_id=None, plan_id_type=None,
                   name=None, name_type=None,
                   type_id=None, type_id_type=None,
                   creation_date=None, creation_date_type=None,
                   default_product_version=None, default_product_version_type=None,
                   author_id=None, author_id_type=None,
                   isactive=None, isactive_type=None,
                   product_id=None, product_id_type=None)
    def testplan_create(self, name, product_id, author_id, type_id, default_product_version, isactive=None)
    def testplan_update(self, plan_id, name, product_id, type_id, product_version, isactive)
    def testplan_get_categories(self, plan_id)
    def testplan_get_builds(self, plan_id)
    def testplan_get_components(self, plan_id)
    def testplan_get_test_cases(self, plan_id)
    def testplan_get_test_runs(self, plan_id)
    def testplan_add_tag(self, plan_id, tag_name)
    def testplan_remove_tag(self, plan_id, tag_name)
    def testplan_get_tags(self, plan_id)
    def testplan_lookup_type_id_by_name(self, name)
    def testplan_lookup_type_name_by_id(self, id)
    """

class TestCaseUnitTests(TestopiaUnitTest):
    """API entry points that aren't yet covered:
    def testcase_get(self, case_id)
    def testcase_list(self, case_id=None, case_id_type=None,
                   alias=None, alias_type=None,
                   arguments=None, arguments_type=None,
                   author_id=None, author_id_type=None,
                   canview=None, canview_type=None,
                   case_status_id=None, case_status_id_type=None,
                   category_id=None, category_id_type=None,
                   creation_date=None, creation_date_type=None,
                   default_tester_id=None, default_tester_id_type=None,
                   isautomated=None, isautomated_type=None,
                   plans=None,
                   priority_id=None, priority_id_type=None,
                   requirement=None, requirement_type=None,
                   script=None, script_type=None,
                   sortkey=None, sortkey_type=None,
                   summary=None, summary_type=None,
                   estimated_time=None, estimated_time_type=None,
                   run_id=None, run_id_type=None)
    def testcase_create(self, summary, plan_id, author_id, isautomated, category_id, case_status_id,
                        alias=None, arguments=None, default_tester_id=None, priority_id=None,
                        requirement=None, script=None, sortkey=None, estimated_time=None)
    def testcase_update(self, case_id, summary=None, isautomated=None,
                   category_id=None, case_status_id=None,
                   alias=None, arguments=None, priority_id=None,
                   requirement=None, script=None,
                   sortkey=None, estimated_time=None)
    def testcase_get_text(self, case_id)
    def testcase_store_text(self, case_id, author_id, setup=None, breakdown=None,
                   action=None, expected_results=None)
    def testcase_get_bugs(self, case_id)
    def testcase_add_component(self, case_id, component_id)
    def testcase_remove_component(self, case_id, component_id)
    def testcase_get_components(self, case_id)
    def testcase_add_tag(self, case_id, tag_name)
    def testcase_remove_tag(self, case_id, tag_name)
    def testcase_get_tags(self, case_id)
    def testcase_get_plans(self, case_id)
    def testcase_lookup_category_id_by_name(self, name)
    def testcase_lookup_category_name_by_id(self, id)
    def testcase_lookup_priority_id_by_name(self, name)
    def testcase_lookup_priority_name_by_id(self, id)

    def testcase_lookup_status_id_by_name(self, name)

    def testcase_lookup_status_name_by_id(self, id)

    def testcase_link_plan(self, case_id, plan_id)
    def testcase_unlink_plan(self, case_id, plan_id)
    """

class TestRunUnitTests(TestopiaUnitTest):
    """API entry points that aren't yet covered:
    def testrun_get(self, run_id):
    def testrun_list(self, run_id=None, run_id_type=None,
                   build_id=None, build_id_type=None,
                   environment_id=None, environment_id_type=None,
                   manager_id=None, manager_id_type=None,
                   notes=None, notes_type=None,
                   plan=None, plan_type=None,
                   plan_id=None, plan_id_type=None,
                   plan_text_version=None, plan_text_version_type=None,
                   product_version=None, product_version_type=None,
                   start_date=None, start_date_type=None,
                   stop_date=None, stop_date_type=None,
                   summary=None, summary_type=None)
    def testrun_create(self, build_id, environment_id, manager_id,
                   plan_id, plan_text_version, summary,
                   notes=None, product_version=None):
    def testrun_update(self, run_id, build_id=None, environment_id=None,
                   manager_id=None, plan_text_version=None, summary=None,
                   notes=None, product_version=None):
    def testrun_get_test_cases(self, run_id):
    def testrun_get_test_case_runs(self, run_id):
    def testrun_get_test_plan(self, run_id):
    def testrun_add_tag(self, run_id, tag_name):
    def testrun_remove_tag(self, run_id, tag_name):
    def testrun_get_tags(self, run_id):
    def testrun_lookup_environment_id_by_name(self, name):
    def testrun_lookup_environment_name_by_id(self, id):
        """
        
class TestCaseRunUnitTests(TestopiaUnitTest):
    """API entry points that aren't yet covered:
    def testcaserun_get(self, case_run_id):
    def testcaserun_list(self, run_id=None, run_id_type=None,
                   assignee=None, assignee_type=None,
                   build_id=None, build_id_type=None,
                   canview=None, canview_type=None,
                   case_id=None, case_id_type=None,
                   case_run_id=None, case_run_id_type=None,
                   case_run_status_id=None, case_run_status_id_type=None,
                   case_text_version=None, case_text_version_type=None,
                   close_date=None, close_date_type=None,
                   environment_id=None, environment_id_type=None,
                   iscurrent=None, iscurrent_type=None,
                   notes=None, notes_type=None,
                   sortkey=None, sortkey_type=None,
                   testedby=None, testedby_type=None)
    def testcaserun_create(self, assignee, build_id, case_id, case_text_version,
                           environment_id, run_id, notes=None)
    def testcaserun_update(self, run_id, case_id, build_id, environment_id,
                    new_build_id=None,
                    new_environment_id=None,
                    case_run_status_id=None,
                    update_bugs=False,
                    assignee=None,
                    notes=None)
    def testcaserun_get_bugs(self, case_run_id):
    def testcaserun_lookup_status_id_by_name(self, name)
    def testcaserun_lookup_status_name_by_id(self, id)

    """

# Hook into pyunit's command-line handling, which will invoke the test
# suite if run directly rather than imported; use -v for more verbose output
# 
# You'll have to have a 'unittest.cfg' file containing config for whatever
# Testopia instance you're talking to
#
if __name__ == '__main__':
    unittest.main()
