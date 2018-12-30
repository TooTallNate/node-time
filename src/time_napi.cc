#include <napi.h>
#include "time_napi.h"

Napi::FunctionReference Time::constructor;

Napi::Object Time::Init(Napi::Env env, Napi::Object exports) {
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

Time::Time(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Time>(info)  {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
}

Napi::Value Time::time(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), "hello world");
}

Napi::Value Time::tzset(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), "hello world");
}

Napi::Value Time::localtime(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), "hello world");
}

Napi::Value Time::mktime(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), "hello world");
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return Time::Init(env, exports);
}

NODE_API_MODULE(addon, InitAll)

/*Napi::String Method(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, "world");
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "time"),
                Napi::Function::New(env, Method));
    exports.Set(Napi::String::New(env, "tzset"),
                Napi::Function::New(env, Method));
    exports.Set(Napi::String::New(env, "localtime"),
                Napi::Function::New(env, Method));
    exports.Set(Napi::String::New(env, "mktime"),
                Napi::Function::New(env, Method));
    return exports;
}

NODE_API_MODULE(hello, Init)*/
