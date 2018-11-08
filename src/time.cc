#include <stdio.h>
#include <stdint.h>
#include <time.h>

#include "napi.h"
#include <cmath>

class Time {
  public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    // time(3)
    exports.Set(Napi::String::New(env, "time"), Napi::Function::New(env, Time_));

    // tzset(3)
    exports.Set(Napi::String::New(env, "tzset"), Napi::Function::New(env, Tzset));

    // localtime
    exports.Set(Napi::String::New(env, "localtime"), Napi::Function::New(env, Localtime));

    // mktime
    exports.Set(Napi::String::New(env, "mktime"), Napi::Function::New(env, Mktime));

    return exports;
  }

  static Napi::Value Time_(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::EscapableHandleScope scope(env);
    return scope.Escape(Napi::Number::New(env, time(NULL)));
  }

  static Napi::Value Tzset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::EscapableHandleScope scope(env);

    // Set up the timezone info from the current TZ environ variable
    tzset();

    // Set up a return object that will hold the results of the timezone change
    Napi::Object obj = Napi::Object::New(env);

    // The 'tzname' char * [] gets put into a JS Array
    int tznameLength = 2;
    Napi::Array tznameArray = Napi::Array::New(env,  tznameLength );
#if _MSC_VER >= 1900
	char szTzName[128];

	for (int i = 0; i < tznameLength; i++) {
		size_t strLength;
		_get_tzname(&strLength, szTzName, 128, i);
		(tznameArray).Set(i, Napi::String::New(env, szTzName));
	}

	(obj).Set(Napi::String::New(env, "tzname"), tznameArray);

	// The 'timezone' long is the "seconds West of UTC"
	long timezone;
	_get_timezone(&timezone);
	(obj).Set(Napi::String::New(env, "timezone"), Napi::Number::New(env, timezone));

	// The 'daylight' int is obselete actually, but I'll include it here for
	// curiosity's sake. See the "Notes" section of "man tzset"
	int daylight;
	_get_daylight(&daylight);
	(obj).Set(Napi::String::New(env, "daylight"), Napi::Number::New(env, daylight));
#else
    for (int i=0; i < tznameLength; i++) {
      (tznameArray).Set(i, Napi::String::New(env, tzname[i]));
    }

    (obj).Set(Napi::String::New(env, "tzname"), tznameArray);

    // The 'timezone' long is the "seconds West of UTC"
    (obj).Set(Napi::String::New(env, "timezone"), Napi::Number::New(env,  timezone ));

    // The 'daylight' int is obselete actually, but I'll include it here for
    // curiosity's sake. See the "Notes" section of "man tzset"
    (obj).Set(Napi::String::New(env, "daylight"), Napi::Number::New(env,  daylight ));
#endif
    return scope.Escape(obj);
  }

  static Napi::Value Localtime(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::EscapableHandleScope scope(env);

    // Construct the 'tm' struct
    time_t rawtime = static_cast<time_t>(info[0].As<Napi::Number>().Int64Value());
    
    struct tm *timeinfo = localtime( &rawtime );

    // Create the return "Object"
    Napi::Object obj = Napi::Object::New(env);

    if (timeinfo && !isnan(info[0].As<Napi::Number>().DoubleValue())) {
      (obj).Set(Napi::String::New(env, "test"), Napi::Number::New(env, rawtime) );
      (obj).Set(Napi::String::New(env, "seconds"), Napi::Number::New(env, timeinfo->tm_sec) );
      (obj).Set(Napi::String::New(env, "minutes"), Napi::Number::New(env, timeinfo->tm_min) );
      (obj).Set(Napi::String::New(env, "hours"), Napi::Number::New(env, timeinfo->tm_hour) );
      (obj).Set(Napi::String::New(env, "dayOfMonth"), Napi::Number::New(env, timeinfo->tm_mday) );
      (obj).Set(Napi::String::New(env, "month"), Napi::Number::New(env, timeinfo->tm_mon) );
      (obj).Set(Napi::String::New(env, "year"), Napi::Number::New(env, timeinfo->tm_year) );
      (obj).Set(Napi::String::New(env, "dayOfWeek"), Napi::Number::New(env, timeinfo->tm_wday) );
      (obj).Set(Napi::String::New(env, "dayOfYear"), Napi::Number::New(env, timeinfo->tm_yday) );
      (obj).Set(Napi::String::New(env, "isDaylightSavings"), Napi::Boolean::New(env, timeinfo->tm_isdst > 0) );

#if defined HAVE_TM_GMTOFF
      // Only available with glibc's "tm" struct. Most Linuxes, Mac OS X...
      (obj).Set(Napi::String::New(env, "gmtOffset"), Napi::Number::New(env, timeinfo->tm_gmtoff) );
      (obj).Set(Napi::String::New(env, "timezone"), Napi::String::New(env, timeinfo->tm_zone) );

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
      (obj).Set(Napi::String::New(env, "gmtOffset"), Napi::Number::New(env, scd));
      (obj).Set(Napi::String::New(env, "timezone"), Napi::String::New(env, tzname[timeinfo->tm_isdst]));
#endif // HAVE_TM_GMTOFF
    } else {
      (obj).Set(Napi::String::New(env, "invalid"), Napi::Boolean::New(env, true));
    }

    return scope.Escape(obj);
  }

  static Napi::Value Mktime(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::EscapableHandleScope scope(env);

    if (info.Length() < 1) {
      Napi::TypeError::New(env, "localtime() Object expected").ThrowAsJavaScriptException();
      return env.Null();
    }

    Napi::Object arg = info[0].As<Napi::Object>();

    struct tm tmstr;
    tmstr.tm_sec   = (arg).Get(Napi::String::New(env, "seconds")).As<Napi::Number>().Int32Value();
    tmstr.tm_min   = (arg).Get(Napi::String::New(env, "minutes")).As<Napi::Number>().Int32Value();
    tmstr.tm_hour  = (arg).Get(Napi::String::New(env, "hours")).As<Napi::Number>().Int32Value();
    tmstr.tm_mday  = (arg).Get(Napi::String::New(env, "dayOfMonth")).As<Napi::Number>().Int32Value();
    tmstr.tm_mon   = (arg).Get(Napi::String::New(env, "month")).As<Napi::Number>().Int32Value();
    tmstr.tm_year  = (arg).Get(Napi::String::New(env, "year")).As<Napi::Number>().Int32Value();
    tmstr.tm_isdst = (arg).Get(Napi::String::New(env, "isDaylightSavings")).As<Napi::Number>().Int32Value();
    // tm_wday and tm_yday are ignored for input, but properly set after 'mktime' is called

    return scope.Escape(Napi::Number::New(env, static_cast<double>(mktime( &tmstr ))));
  }

};

extern "C" {
  static Napi::Object init (Napi::Env env, Napi::Object exports) {
    return Time::Init(env, exports);
  }
  NODE_API_MODULE(time, init)
}
