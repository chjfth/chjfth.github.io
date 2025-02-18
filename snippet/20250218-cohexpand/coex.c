// coex.c
#include <stdio.h>

#define cox_MAKE_STRING(asymbol) #asymbol
#define coy_MAKE_STRING(s) cox_MAKE_STRING(s)

#define WRAP_B(s) [s]
#define WRAP_BQ(s) coy_MAKE_STRING( WRAP_B(s) )

#define coy_WRAP_BQ(s) cox_MAKE_STRING( WRAP_B(s) )


#define greet  hello world

int main()
{
	char *pcox, *pcoy, *pcoz;
	
	pcox = cox_MAKE_STRING( WRAP_B(greet) );
	printf("pcox = %s\n", pcox);

	pcoy = coy_MAKE_STRING( WRAP_B(greet) );
	printf("pcoy = %s\n", pcoy);

	pcoz = coy_WRAP_BQ( greet ); // C99spec text vague!
	printf("pcoz = %s\n", pcoz);
}
