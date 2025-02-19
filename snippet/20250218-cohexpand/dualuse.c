#include <stdio.h>

int SysVarW = 3;
int SysVarA = 1;
int SysVar  = 0;

int ten_SysVarW = 13;
int ten_SysVarA = 11;
int ten_SysVar  = 10;


#ifdef _UNICODE
#define SysVar SysVarW
#define tenSysVar tenSysVarW
#else
#define SysVar SysVarA
#define tenSysVar tenSysVarA
#endif

void PrintVar(int val, const char* str, int tenval)
{
	printf("val=%d , str=%s , tenval=%d\n", val, str, tenval);
}

#define cox_DUAL_USE(symbol) PrintVar(symbol, #symbol, ten_ ## symbol)

int main()
{
	cox_DUAL_USE(SysVar);
	return 0;
}

