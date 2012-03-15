#include <stdio.h>
#include <stdint.h>
#include <time.h>

#include <v8.h>
#include <node.h>


using namespace node;
using namespace v8;


class Time {
  public:
  static void Init(Handle<Object> target) {
    HandleScope scope;

    // time(3)
    NODE_SET_METHOD(target, "time", Time_);

    // tzset(3)
    NODE_SET_METHOD(target, "tzset", Tzset);

    // localtime
    NODE_SET_METHOD(target, "localtime", Localtime);

    // mktime
    NODE_SET_METHOD(target, "mktime", Mktime);
  }

  static Handle<Value> Time_(const Arguments& args) {
    return Integer::New(time(NULL));
  }

  static Handle<Value> Tzset(const Arguments& args) {
    HandleScope scope;

    // Set up the timezone info from the current TZ environ variable
    tzset();

    // Set up a return object that will hold the results of the timezone change
    Local<Object> obj = Object::New();

    // The 'tzname' char * [] gets put into a JS Array
    int tznameLength = 2;
    Local<Array> tznameArray = Array::New( tznameLength );
    for (int i=0; i < tznameLength; i++) {
      tznameArray->Set(Number::New(i), String::NewSymbol( tzname[i] ));
    }
    obj->Set(String::NewSymbol("tzname"), tznameArray);

    // The 'timezone' long is the "seconds West of UTC"
    obj->Set(String::NewSymbol("timezone"), Number::New( timezone ));

    // The 'daylight' int is obselete actually, but I'll include it here for
    // curiosity's sake. See the "Notes" section of "man tzset"
    obj->Set(String::NewSymbol("daylight"), Number::New( daylight ));

    return scope.Close(obj);
  }

  static Handle<Value> Localtime(const Arguments& args) {
    HandleScope scope;

    // Construct the 'tm' struct
    time_t rawtime = static_cast<time_t>(args[0]->Int32Value());
    struct tm *timeinfo = localtime( &rawtime );

    // Create the return "Object"
    Local<Object> obj = Object::New();
    obj->Set(String::NewSymbol("seconds"), Integer::New(timeinfo->tm_sec) );
    obj->Set(String::NewSymbol("minutes"), Integer::New(timeinfo->tm_min) );
    obj->Set(String::NewSymbol("hours"), Integer::New(timeinfo->tm_hour) );
    obj->Set(String::NewSymbol("dayOfMonth"), Integer::New(timeinfo->tm_mday) );
    obj->Set(String::NewSymbol("month"), Integer::New(timeinfo->tm_mon) );
    obj->Set(String::NewSymbol("year"), Integer::New(timeinfo->tm_year) );
    obj->Set(String::NewSymbol("dayOfWeek"), Integer::New(timeinfo->tm_wday) );
    obj->Set(String::NewSymbol("dayOfYear"), Integer::New(timeinfo->tm_yday) );
    obj->Set(String::NewSymbol("isDaylightSavings"), Boolean::New(timeinfo->tm_isdst > 0) );

#if defined HAVE_TM_GMTOFF
    // Only available with glibc's "tm" struct. Most Linuxes, Mac OS X...
    obj->Set(String::NewSymbol("gmtOffset"), Integer::New(timeinfo->tm_gmtoff) );
    obj->Set(String::NewSymbol("timezone"), String::NewSymbol(timeinfo->tm_zone) );

#elif defined HAVE_TIMEZONE
    // Compatibility for Cygwin, Solaris, probably others...
    long scd;
    if (timeinfo->tm_isdst > 0) {
  #ifdef HAVE_ALTZONE
      scd = -altzone;
  #else
      scd = -timezone + 3600;
  #endif // HAVE_ALTZONE
    } else {
      scd = -timezone;
    }
    obj->Set(String::NewSymbol("gmtOffset"), Integer::New(scd));
    obj->Set(String::NewSymbol("timezone"), String::NewSymbol(tzname[timeinfo->tm_isdst]));
#endif // HAVE_TM_GMTOFF

    return scope.Close(obj);
  }

  static Handle<Value> Mktime(const Arguments& args) {
    HandleScope scope;
    if (args.Length() < 1) {
      Local<String> message = String::New("localtime() Object expected");
      return ThrowException(Exception::TypeError(message));
    }

    Local<Object> arg = args[0]->ToObject();

    struct tm tmstr;
    tmstr.tm_sec   = arg->Get(String::NewSymbol("seconds"))->Int32Value();
    tmstr.tm_min   = arg->Get(String::NewSymbol("minutes"))->Int32Value();
    tmstr.tm_hour  = arg->Get(String::NewSymbol("hours"))->Int32Value();
    tmstr.tm_mday  = arg->Get(String::NewSymbol("dayOfMonth"))->Int32Value();
    tmstr.tm_mon   = arg->Get(String::NewSymbol("month"))->Int32Value();
    tmstr.tm_year  = arg->Get(String::NewSymbol("year"))->Int32Value();
    tmstr.tm_isdst = arg->Get(String::NewSymbol("isDaylightSavings"))->Int32Value();
    // tm_wday and tm_yday are ignored for input, but properly set after 'mktime' is called

    return scope.Close(Integer::New(mktime( &tmstr )));
  }

};

extern "C" {
  static void init (Handle<Object> target) {
    Time::Init(target);
  }
  NODE_MODULE(time, init);
}
