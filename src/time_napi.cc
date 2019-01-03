#include <napi.h>
#include "time_napi.h"
#include <time.h>

Napi::FunctionReference Time::constructor;

Napi::Object Time::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "Time", {
            InstanceMethod("tzset", &Time::tzset),
            InstanceMethod("localtime", &Time::localtime),
            InstanceMethod("mktime", &Time::mktime),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Time", func);
    return exports;
}

Time::Time(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Time>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
}

Napi::Value Time::tzset(const Napi::CallbackInfo &info) {
    ::tzset();

    // Set up a return object that will hold the results of the timezone change
    Napi::Object obj = Napi::Object::New(info.Env());
    // The 'tzname' char * [] gets put into a JS Array
    size_t tznameLength = 2;
    Napi::Array tznameArray = Napi::Array::New(info.Env(), tznameLength);
#if _MSC_VER >= 1900
    char szTzName[128];

	for (int i = 0; i < tznameLength; i++) {
		size_t strLength;
		_get_tzname(&strLength, szTzName, 128, i);
		tznameArray[i] = Napi::String::New(info.Env(), szTzName);
	}

    obj.Set("tzname", tznameArray);
	// The 'timezone' long is the "seconds West of UTC"
	long timezone;
	// MS C++ specific
	// https://docs.microsoft.com/en-us/cpp/c-runtime-library/reference/get-timezone?view=vs-2017
	_get_timezone(&timezone);
	obj.Set("timezone", timezone);

	// The 'daylight' int is obselete actually, but I'll include it here for
	// curiosity's sake. See the "Notes" section of "man tzset"
	int daylight;
	_get_daylight(&daylight);
	obj.Set("daylight", daylight);
#else
    for (size_t i = 0; i < tznameLength; i++) {
        // tzname is from environment variable TZ
        // http://www.gnu.org/software/libc/manual/html_node/TZ-Variable.html
        tznameArray[i] = Napi::String::New(info.Env(), tzname[i]);
    }

    obj.Set("tzname", tznameArray);

    // The 'timezone' long is the "seconds West of UTC"
    obj.Set("timezone", timezone);

    // The 'daylight' int is obselete actually, but I'll include it here for
    // curiosity's sake. See the "Notes" section of "man tzset"
    obj.Set("daylight", daylight);
#endif
    return obj;
}

Napi::Value Time::localtime(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Construct the 'tm' struct
    time_t rawtime = static_cast<time_t>(info[0].As<Napi::Number>().DoubleValue());
    struct tm *timeinfo = ::localtime(&rawtime);
    // Create the return "Object"
    Napi::Object obj = Napi::Object::New(env);

    if (timeinfo) {
        obj.Set("seconds", timeinfo->tm_sec);
        obj.Set("minutes", timeinfo->tm_min);
        obj.Set("hours", timeinfo->tm_hour);
        obj.Set("dayOfMonth", timeinfo->tm_mday);
        obj.Set("month", timeinfo->tm_mon);
        obj.Set("year", timeinfo->tm_year);
        obj.Set("dayOfWeek", timeinfo->tm_wday);
        obj.Set("dayOfYear", timeinfo->tm_yday);
        obj.Set("isDaylightSavings", (timeinfo->tm_isdst > 0));
#if defined HAVE_TM_GMTOFF
        // Only available with glibc's "tm" struct. Most Linuxes, Mac OS X...
        obj.Set("gmtOffset", timeinfo->tm_gmtoff);
        obj.Set("timezone", timeinfo->tm_zone);
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
        obj.Set("gmtOffset", scd);
        obj.Set('timezone', tzname[timeinfo->tm_isdst]);
#endif // HAVE_TM_GMTOFF
    } else {
        obj.Set("invalid", true);
    }

    return obj;
}

Napi::Value Time::mktime(const Napi::CallbackInfo &info) {

    Napi::Env env = info.Env();
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    if (!info[0].IsObject()) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    Napi::Object obj = info[0].As<Napi::Object>();
    struct tm tmstr;
    tmstr.tm_sec = obj.Get("seconds").As<Napi::Number>().Uint32Value();
    tmstr.tm_min = obj.Get("minutes").As<Napi::Number>().Uint32Value();
    tmstr.tm_hour = obj.Get("hours").As<Napi::Number>().Uint32Value();
    tmstr.tm_mday = obj.Get("dayOfMonth").As<Napi::Number>().Uint32Value();
    tmstr.tm_mon = obj.Get("month").As<Napi::Number>().Uint32Value();
    tmstr.tm_year = obj.Get("year").As<Napi::Number>().Uint32Value();
    tmstr.tm_isdst = obj.Get("isDaylightSavings").As<Napi::Number>().Uint32Value();
    double myMakeTmVal = ::mktime(&tmstr);
    Napi::Number myMakeTm = Napi::Number::New(env, myMakeTmVal);
    return myMakeTm;
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return Time::Init(env, exports);
}

NODE_API_MODULE(time, InitAll)

