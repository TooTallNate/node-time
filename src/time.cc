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
    NanEscapableScope();
    NanReturnValue(NanNew<v8::Integer>(time(NULL)));
  }

  static NAN_METHOD(Tzset) {
    NanEscapableScope();

    // Set up the timezone info from the current TZ environ variable
    tzset();

    // Set up a return object that will hold the results of the timezone change
    Local<Object> obj = NanNew<v8::Object>();

    // The 'tzname' char * [] gets put into a JS Array
    int tznameLength = 2;
    Local<Array> tznameArray = NanNew<v8::Array>( tznameLength );
    for (int i=0; i < tznameLength; i++) {
      tznameArray->Set(i, NanNew<v8::String>( tzname[i] ));
    }
    obj->Set(NanNew<v8::String>("tzname"), tznameArray);

    // The 'timezone' long is the "seconds West of UTC"
    obj->Set(NanNew<v8::String>("timezone"), NanNew<v8::Number>( timezone ));

    // The 'daylight' int is obselete actually, but I'll include it here for
    // curiosity's sake. See the "Notes" section of "man tzset"
    obj->Set(NanNew<v8::String>("daylight"), NanNew<v8::Number>( daylight ));

    NanReturnValue(obj);
  }

  static NAN_METHOD(Localtime) {
    NanEscapableScope();

    // Construct the 'tm' struct
    time_t rawtime = static_cast<time_t>(args[0]->IntegerValue());
    struct tm *timeinfo = localtime( &rawtime );

    // Create the return "Object"
    Local<Object> obj = NanNew<v8::Object>();

    if (timeinfo) {
      obj->Set(NanNew<v8::String>("seconds"), NanNew<v8::Integer>(timeinfo->tm_sec) );
      obj->Set(NanNew<v8::String>("minutes"), NanNew<v8::Integer>(timeinfo->tm_min) );
      obj->Set(NanNew<v8::String>("hours"), NanNew<v8::Integer>(timeinfo->tm_hour) );
      obj->Set(NanNew<v8::String>("dayOfMonth"), NanNew<v8::Integer>(timeinfo->tm_mday) );
      obj->Set(NanNew<v8::String>("month"), NanNew<v8::Integer>(timeinfo->tm_mon) );
      obj->Set(NanNew<v8::String>("year"), NanNew<v8::Integer>(timeinfo->tm_year) );
      obj->Set(NanNew<v8::String>("dayOfWeek"), NanNew<v8::Integer>(timeinfo->tm_wday) );
      obj->Set(NanNew<v8::String>("dayOfYear"), NanNew<v8::Integer>(timeinfo->tm_yday) );
      obj->Set(NanNew<v8::String>("isDaylightSavings"), NanNew<v8::Boolean>(timeinfo->tm_isdst > 0) );

#if defined HAVE_TM_GMTOFF
      // Only available with glibc's "tm" struct. Most Linuxes, Mac OS X...
      obj->Set(NanNew<v8::String>("gmtOffset"), NanNew<v8::Integer>(timeinfo->tm_gmtoff) );
      obj->Set(NanNew<v8::String>("timezone"), NanNew<v8::String>(timeinfo->tm_zone) );

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
      obj->Set(NanNew<v8::String>("gmtOffset"), NanNew<v8::Integer>(scd));
      obj->Set(NanNew<v8::String>("timezone"), NanNew<v8::String>(tzname[timeinfo->tm_isdst]));
#endif // HAVE_TM_GMTOFF
    } else {
      obj->Set(NanNew<v8::String>("invalid"), NanNew<v8::Boolean>(true));
    }

    NanReturnValue(obj);
  }

  static NAN_METHOD(Mktime) {
    NanEscapableScope();

    if (args.Length() < 1) {
      return NanThrowTypeError("localtime() Object expected");
    }

    Local<Object> arg = args[0].As<v8::Object>();

    struct tm tmstr;
    tmstr.tm_sec   = arg->Get(NanNew<v8::String>("seconds"))->Int32Value();
    tmstr.tm_min   = arg->Get(NanNew<v8::String>("minutes"))->Int32Value();
    tmstr.tm_hour  = arg->Get(NanNew<v8::String>("hours"))->Int32Value();
    tmstr.tm_mday  = arg->Get(NanNew<v8::String>("dayOfMonth"))->Int32Value();
    tmstr.tm_mon   = arg->Get(NanNew<v8::String>("month"))->Int32Value();
    tmstr.tm_year  = arg->Get(NanNew<v8::String>("year"))->Int32Value();
    tmstr.tm_isdst = arg->Get(NanNew<v8::String>("isDaylightSavings"))->Int32Value();
    // tm_wday and tm_yday are ignored for input, but properly set after 'mktime' is called

    NanReturnValue(NanNew<v8::Number>(static_cast<double>(mktime( &tmstr ))));
  }

};

extern "C" {
  static void init (Handle<Object> target) {
    Time::Init(target);
  }
  NODE_MODULE(time, init)
}
