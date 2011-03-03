#include <stdio.h>
#include <stdint.h>
#include <time.h>

#include <v8.h>
#include <node.h>


using namespace node;
using namespace v8;


class Time
{
  public : static void Init(Handle<Object> target)
  {
    HandleScope scope;

    // time(3)
    Persistent<FunctionTemplate> s_time = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Time_));
    target->Set(String::NewSymbol("time"), s_time->GetFunction());

    // tzset(3)
    Persistent<FunctionTemplate> s_tzset = Persistent<FunctionTemplate>::New(FunctionTemplate::New(tzset_));
    target->Set(String::NewSymbol("tzset"), s_tzset->GetFunction());

    // localtime
    Persistent<FunctionTemplate> s_localtime = Persistent<FunctionTemplate>::New(FunctionTemplate::New(localtime_));
    target->Set(String::NewSymbol("localtime"), s_localtime->GetFunction());
  }

  static Handle<Value> Time_(const Arguments& args)
  {
    return Integer::New(time(NULL));
  }

  static Handle<Value> tzset_(const Arguments& args)
  {
    HandleScope scope;

    // Set up the timezone info from the current TZ environ variable
    tzset();

    // Set up a return object that will hold the results of the timezone change
    Local<Object> obj = Object::New();

    // The 'tzname' char * [] gets put into a JS Array
    int tznameLength = sizeof(tzname) / sizeof(*tzname);
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

  static Handle<Value> localtime_(const Arguments& args)
  {
    HandleScope scope;

    // Construct the 'tm' struct
    time_t rawtime = static_cast<time_t>(args[0]->Int32Value());
    struct tm * timeinfo = localtime ( &rawtime );

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

    // Only available with glibc's "tm" struct
    obj->Set(String::NewSymbol("gmtOffset"), Integer::New(timeinfo->tm_gmtoff) );
    obj->Set(String::NewSymbol("timezone"), String::NewSymbol(timeinfo->tm_zone) );

    return scope.Close(obj);
  }
};

extern "C" {
  static void init (Handle<Object> target)
  {
    Time::Init(target);
  }

  NODE_MODULE(time, init);
}
