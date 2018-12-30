//
// Created by Glenn Hinks on 12/30/18.
//

#ifndef NODE_TIME_TIME_NAPI_H
#define NODE_TIME_TIME_NAPI_H
class Time : public Napi::ObjectWrap<Time> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Time(const Napi::CallbackInfo& info);
private:
    static Napi::FunctionReference constructor;

    Napi::Value time(const Napi::CallbackInfo& info);
    Napi::Value tzset(const Napi::CallbackInfo& info);
    Napi::Value localtime(const Napi::CallbackInfo& info);
    Napi::Value mktime(const Napi::CallbackInfo& info);
};
#endif //NODE_TIME_TIME_NAPI_H
