#include <stdio.h>
#include <stdint.h>
#include <time.h>

#include <v8.h>
#include <node.h>
#include "nan.h"


using namespace node;
using namespace v8;


class Time {
  public:
  static void Init(Handle<Object> target) {
    NanScope();

    // time(3)
    NODE_SET_METHOD(target, "time", Time_);

    // tzset(3)
    NODE_SET_METHOD(target, "tzset", Tzset);

    // localtime
    NODE_SET_METHOD(target, "localtime", Localtime);

    // mktime
    NODE_SET_METHOD(target, "mktime", Mktime);
  }

  static NAN_METHOD(Time_) {
    NanScope();
    NanReturnValue(Integer::New(time(NULL)));
  }

  static NAN_METHOD(Tzset) {
    NanScope();

    // Set up the timezone info from the current TZ environ variable
    tzset();

    // Set up a return object that will hold the results of the timezone change
    Local<Object> obj = Object::New();

    // The 'tzname' char * [] gets put into a JS Array
    int tznameLength = 2;
    Local<Array> tznameArray = Array::New( tznameLength );
    for (int i=0; i < tznameLength; i++) {
      tznameArray->Set(Number::New(i), NanSymbol( tzname[i] ));
    }
    obj->Set(NanSymbol("tzname"), tznameArray);

    // The 'timezone' long is the "seconds West of UTC"
    obj->Set(NanSymbol("timezone"), Number::New( timezone ));

    // The 'daylight' int is obselete actually, but I'll include it here for
    // curiosity's sake. See the "Notes" section of "man tzset"
    obj->Set(NanSymbol("daylight"), Number::New( daylight ));

    NanReturnValue(obj);
  }

  static NAN_METHOD(Localtime) {
    NanScope();

    // Construct the 'tm' struct
    time_t rawtime = static_cast<time_t>(args[0]->IntegerValue());
    struct tm *timeinfo = localtime( &rawtime );

    // Create the return "Object"
    Local<Object> obj = Object::New();

    if (timeinfo) {
      obj->Set(NanSymbol("seconds"), Integer::New(timeinfo->tm_sec) );
      obj->Set(NanSymbol("minutes"), Integer::New(timeinfo->tm_min) );
      obj->Set(NanSymbol("hours"), Integer::New(timeinfo->tm_hour) );
      obj->Set(NanSymbol("dayOfMonth"), Integer::New(timeinfo->tm_mday) );
      obj->Set(NanSymbol("month"), Integer::New(timeinfo->tm_mon) );
      obj->Set(NanSymbol("year"), Integer::New(timeinfo->tm_year) );
      obj->Set(NanSymbol("dayOfWeek"), Integer::New(timeinfo->tm_wday) );
      obj->Set(NanSymbol("dayOfYear"), Integer::New(timeinfo->tm_yday) );
      obj->Set(NanSymbol("isDaylightSavings"), Boolean::New(timeinfo->tm_isdst > 0) );

#if defined HAVE_TM_GMTOFF
      // Only available with glibc's "tm" struct. Most Linuxes, Mac OS X...
      obj->Set(NanSymbol("gmtOffset"), Integer::New(timeinfo->tm_gmtoff) );
      obj->Set(NanSymbol("timezone"), NanSymbol(timeinfo->tm_zone) );

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
      obj->Set(NanSymbol("gmtOffset"), Integer::New(scd));
      obj->Set(NanSymbol("timezone"), NanSymbol(tzname[timeinfo->tm_isdst]));
#endif // HAVE_TM_GMTOFF
    } else {
      obj->Set(NanSymbol("invalid"), True());
    }

    NanReturnValue(obj);
  }

  static NAN_METHOD(Mktime) {
    NanScope();
    if (args.Length() < 1) {
      return NanThrowTypeError("localtime() Object expected");
    }

    Local<Object> arg = args[0]->ToObject();

    struct tm tmstr;
    tmstr.tm_sec   = arg->Get(NanSymbol("seconds"))->Int32Value();
    tmstr.tm_min   = arg->Get(NanSymbol("minutes"))->Int32Value();
    tmstr.tm_hour  = arg->Get(NanSymbol("hours"))->Int32Value();
    tmstr.tm_mday  = arg->Get(NanSymbol("dayOfMonth"))->Int32Value();
    tmstr.tm_mon   = arg->Get(NanSymbol("month"))->Int32Value();
    tmstr.tm_year  = arg->Get(NanSymbol("year"))->Int32Value();
    tmstr.tm_isdst = arg->Get(NanSymbol("isDaylightSavings"))->Int32Value();
    // tm_wday and tm_yday are ignored for input, but properly set after 'mktime' is called

    NanReturnValue(Number::New(static_cast<double>(mktime( &tmstr ))));
  }

};

extern "C" {
  static void init (Handle<Object> target) {
    Time::Init(target);
  }
  NODE_MODULE(time, init)
}
