#include <stdio.h>
#include <stdint.h>
#include <time.h>

#include "nan.h"

using namespace node;
using namespace v8;

class Time {
  public:
  static void Init(Handle<Object> target) {
    Nan::HandleScope scope;

    // time(3)
    Nan::SetMethod(target, "time", Time_);

    // tzset(3)
    Nan::SetMethod(target, "tzset", Tzset);

    // localtime
    Nan::SetMethod(target, "localtime", Localtime);

    // mktime
    Nan::SetMethod(target, "mktime", Mktime);
  }

  static NAN_METHOD(Time_) {
    Nan::EscapableHandleScope scope;
    info.GetReturnValue().Set(scope.Escape(Nan::New<v8::Number>(time(NULL))));
  }

  static NAN_METHOD(Tzset) {
    Nan::EscapableHandleScope scope;

    // Set up the timezone info from the current TZ environ variable
    tzset();

    // Set up a return object that will hold the results of the timezone change
    Local<Object> obj = Nan::New<v8::Object>();

    // The 'tzname' char * [] gets put into a JS Array
    int tznameLength = 2;
    Local<Array> tznameArray = Nan::New<v8::Array>( tznameLength );
#if _MSC_VER >= 1900
	char szTzName[128];

	for (int i = 0; i < tznameLength; i++) {
		size_t strLength;
		_get_tzname(&strLength, szTzName, 128, i);
		Nan::Set(tznameArray, i, Nan::New<v8::String>(szTzName).ToLocalChecked());
	}

	Nan::Set(obj, Nan::New("tzname").ToLocalChecked(), tznameArray);

	// The 'timezone' long is the "seconds West of UTC"
	long timezone;
	_get_timezone(&timezone);
	Nan::Set(obj, Nan::New("timezone").ToLocalChecked(), Nan::New<v8::Number>(timezone));

	// The 'daylight' int is obselete actually, but I'll include it here for
	// curiosity's sake. See the "Notes" section of "man tzset"
	int daylight;
	_get_daylight(&daylight);
	Nan::Set(obj, Nan::New("daylight").ToLocalChecked(), Nan::New<v8::Number>(daylight));
#else
    for (int i=0; i < tznameLength; i++) {
      Nan::Set(tznameArray, i, Nan::New<v8::String>(tzname[i]).ToLocalChecked());
    }

    Nan::Set(obj, Nan::New("tzname").ToLocalChecked(), tznameArray);

    // The 'timezone' long is the "seconds West of UTC"
    Nan::Set(obj, Nan::New("timezone").ToLocalChecked(), Nan::New<v8::Number>( timezone ));

    // The 'daylight' int is obselete actually, but I'll include it here for
    // curiosity's sake. See the "Notes" section of "man tzset"
    Nan::Set(obj, Nan::New("daylight").ToLocalChecked(), Nan::New<v8::Number>( daylight ));
#endif
    info.GetReturnValue().Set(scope.Escape(obj));
  }

  static NAN_METHOD(Localtime) {
    Nan::EscapableHandleScope scope;

    // Construct the 'tm' struct
    time_t rawtime = static_cast<time_t>(info[0]->IntegerValue());
    struct tm *timeinfo = localtime( &rawtime );

    // Create the return "Object"
    Local<Object> obj = Nan::New<v8::Object>();

    if (timeinfo) {
      Nan::Set(obj, Nan::New("seconds").ToLocalChecked(), Nan::New<v8::Integer>(timeinfo->tm_sec) );
      Nan::Set(obj, Nan::New("minutes").ToLocalChecked(), Nan::New<v8::Integer>(timeinfo->tm_min) );
      Nan::Set(obj, Nan::New("hours").ToLocalChecked(), Nan::New<v8::Integer>(timeinfo->tm_hour) );
      Nan::Set(obj, Nan::New("dayOfMonth").ToLocalChecked(), Nan::New<v8::Integer>(timeinfo->tm_mday) );
      Nan::Set(obj, Nan::New("month").ToLocalChecked(), Nan::New<v8::Integer>(timeinfo->tm_mon) );
      Nan::Set(obj, Nan::New("year").ToLocalChecked(), Nan::New<v8::Integer>(timeinfo->tm_year) );
      Nan::Set(obj, Nan::New("dayOfWeek").ToLocalChecked(), Nan::New<v8::Integer>(timeinfo->tm_wday) );
      Nan::Set(obj, Nan::New("dayOfYear").ToLocalChecked(), Nan::New<v8::Integer>(timeinfo->tm_yday) );
      Nan::Set(obj, Nan::New("isDaylightSavings").ToLocalChecked(), Nan::New<v8::Boolean>(timeinfo->tm_isdst > 0) );

#if defined HAVE_TM_GMTOFF
      // Only available with glibc's "tm" struct. Most Linuxes, Mac OS X...
      Nan::Set(obj, Nan::New("gmtOffset").ToLocalChecked(), Nan::New<v8::Number>(timeinfo->tm_gmtoff) );
      Nan::Set(obj, Nan::New("timezone").ToLocalChecked(), Nan::New(timeinfo->tm_zone).ToLocalChecked() );

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
      Nan::Set(obj, Nan::New("gmtOffset").ToLocalChecked(), Nan::New<v8::Integer>(scd));
      Nan::Set(obj, Nan::New("timezone").ToLocalChecked(), Nan::New<v8::String>(tzname[timeinfo->tm_isdst]));
#endif // HAVE_TM_GMTOFF
    } else {
      Nan::Set(obj, Nan::New("invalid").ToLocalChecked(), Nan::New<v8::Boolean>(true));
    }

    info.GetReturnValue().Set(scope.Escape(obj));
  }

  static NAN_METHOD(Mktime) {
    Nan::EscapableHandleScope scope;

    if (info.Length() < 1) {
      return Nan::ThrowTypeError("localtime() Object expected");
    }

    Local<Object> arg = info[0].As<v8::Object>();

    struct tm tmstr;
    tmstr.tm_sec   = Nan::Get(arg, Nan::New("seconds").ToLocalChecked()).ToLocalChecked()->Int32Value();
    tmstr.tm_min   = Nan::Get(arg, Nan::New("minutes").ToLocalChecked()).ToLocalChecked()->Int32Value();
    tmstr.tm_hour  = Nan::Get(arg, Nan::New("hours").ToLocalChecked()).ToLocalChecked()->Int32Value();
    tmstr.tm_mday  = Nan::Get(arg, Nan::New("dayOfMonth").ToLocalChecked()).ToLocalChecked()->Int32Value();
    tmstr.tm_mon   = Nan::Get(arg, Nan::New("month").ToLocalChecked()).ToLocalChecked()->Int32Value();
    tmstr.tm_year  = Nan::Get(arg, Nan::New("year").ToLocalChecked()).ToLocalChecked()->Int32Value();
    tmstr.tm_isdst = Nan::Get(arg, Nan::New("isDaylightSavings").ToLocalChecked()).ToLocalChecked()->Int32Value();
    // tm_wday and tm_yday are ignored for input, but properly set after 'mktime' is called

    info.GetReturnValue().Set(scope.Escape(Nan::New<v8::Number>(static_cast<double>(mktime( &tmstr )))));
  }

};

extern "C" {
  static void init (Handle<Object> target) {
    Time::Init(target);
  }
  NODE_MODULE(time, init)
}
