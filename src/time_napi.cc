#include <napi.h>
#include "time_napi.h"
#include <time.h>
#include <iostream>

Napi::FunctionReference Time::constructor;

Napi::Object Time::Init(Napi::Env env, Napi::Object exports) {
    std::cout << "================= native init ========================" << std::endl;
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "Time", {
            InstanceMethod("time", &Time::time),
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
    std::cout << "================= native ctor ========================" << std::endl;
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
}

Napi::Value Time::time(const Napi::CallbackInfo &info) {
    std::cout << "================= native time ========================" << std::endl;
    return Napi::String::New(info.Env(), "hello world 1");
}

// MSVC++ 14.0  _MSC_VER == 1900 (Visual Studio 2015 version 14.0)

Napi::Value Time::tzset(const Napi::CallbackInfo &info) {
    std::cout << "================= native tzset ========================" << std::endl;
    // Nan::EscapableHandleScope scope;
    // Napi::EscapableHandleScope scope = Napi::EscapableHandleScope::New(info.Env());
    // Set up the timezone info from the current TZ environ variable
    // tzset(); this really looks odd calling it twice ?

    // Set up a return object that will hold the results of the timezone change
    // Local<Object> obj = Nan::New<v8::Object>();
    Napi::Object obj = Napi::Object::New(info.Env());

    // The 'tzname' char * [] gets put into a JS Array
    size_t tznameLength = 2;
    // Local<Array> tznameArray = Nan::New<v8::Array>( tznameLength );
    Napi::Array tznameArray = Napi::Array::New(info.Env(), tznameLength);
    for (size_t i = 0; i < tznameLength; i++) {
        // Nan::Set(tznameArray, i, Nan::New<v8::String>(tzname[i]).ToLocalChecked());
        std::cout << "time zone name from ? " << i << " " << tzname[i] << std::endl;
        // tzname is from environment variable TZ
        // http://www.gnu.org/software/libc/manual/html_node/TZ-Variable.html
        tznameArray[i] = Napi::String::New(info.Env(), tzname[i]);
    }

    // Nan::Set(obj, Nan::New("tzname").ToLocalChecked(), tznameArray);
    obj.Set("tzname", tznameArray);

    // The 'timezone' long is the "seconds West of UTC"
    // Nan::Set(obj, Nan::New("timezone").ToLocalChecked(), Nan::New<v8::Number>( timezone ));
    obj.Set("timezone", timezone);

    // The 'daylight' int is obselete actually, but I'll include it here for
    // curiosity's sake. See the "Notes" section of "man tzset"
    //Nan::Set(obj, Nan::New("daylight").ToLocalChecked(), Nan::New<v8::Number>( daylight ));
    obj.Set("daylight", daylight);

    // info.GetReturnValue().Set(scope.Escape(obj));

    obj.Set("funkyChicken", "the funky chicken");

    return obj;
}

Napi::Value Time::localtime(const Napi::CallbackInfo &info) {
    std::cout << "================= native localtime ========================"
    << info.Length()
    << std::endl;
    Napi::Env env = info.Env();
    // Nan::EscapableHandleScope scope;

    // Construct the 'tm' struct
    // time_t rawtime = static_cast<time_t>(info[0]->IntegerValue());
    // struct tm *timeinfo = localtime(&rawtime);

    if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
            return env.Null();
    }

    if (!info[0].IsNumber() ) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    time_t rawtime = static_cast<time_t>(info[0].As<Napi::Number>().Int64Value());
    struct tm *timeinfo = ::localtime(&rawtime);
    // Create the return "Object"
    // Local <Object> obj = Nan::New<v8::Object>();
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
    }
    return obj;
}

Napi::Value Time::mktime(const Napi::CallbackInfo &info) {
    std::cout << "================= native mktime ========================" << std::endl;
    Napi::Env env = info.Env();
    if (info.Length() < 1) {
         Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
            return env.Null();
    }
    std::cout << "================= args count checked ========================" << std::endl;
    if (!info[0].IsObject() ) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    std::cout << "================= arg value is an object ========================" << std::endl;
    Napi::Object obj = info[0].As<Napi::Object>();
    std::cout << "================= tm struct manipulate ========================" << std::endl;
    struct tm tmstr;
    tmstr.tm_sec = obj.Get("seconds").As<Napi::Number>().Uint32Value();
    tmstr.tm_min = obj.Get("minutes").As<Napi::Number>().Uint32Value();
    tmstr.tm_hour = obj.Get("hours").As<Napi::Number>().Uint32Value();
    tmstr.tm_mday = obj.Get("dayOfMonth").As<Napi::Number>().Uint32Value();
    tmstr.tm_mon = obj.Get("month").As<Napi::Number>().Uint32Value();
    tmstr.tm_year = obj.Get("year").As<Napi::Number>().Uint32Value();
    tmstr.tm_isdst = obj.Get("isDaylightSavings").As<Napi::Number>().Uint32Value();
    std::cout << "================= tm struct manipulated ========================" << std::endl;
    std::cout << "tm_mday=" << tmstr.tm_mday << std::endl;
    double myMakeTmVal = ::mktime(&tmstr);
    std::cout << "myMakeTmVal = " << myMakeTmVal << std::endl;
    Napi::Number myMakeTm = Napi::Number::New(env, myMakeTmVal);
    return myMakeTm;
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return Time::Init(env, exports);
}

NODE_API_MODULE(time, InitAll)

