// sptest.cpp (only for Windows)
#include <stdio.h>
#include <tchar.h>

#define cox_MAKE_STRING(asymbol) #asymbol
#define coy_MAKE_STRING(s) cox_MAKE_STRING(s)

#define WRAP_BQ(s) coy_MAKE_STRING([s])

int _tmain()
{
    const TCHAR *psz = _T( WRAP_BQ(greet) );
    _tprintf(_T("Greeting: %s\n"), psz);
    return 0;
}
