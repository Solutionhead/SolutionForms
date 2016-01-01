To set up your dev environment to test this app, you will need to perform two simple configurations:

1. Enable IIS to resolve the test domains:
	a. Open `hosts` file at `C:\Windows\System32\drivers\etc`
	b. Add the following lines to the and of the file:

127.0.0.1		www.solutionforms.local
127.0.0.1		solutionforms.local
127.0.0.1		test.solutionforms.local

2. Change the application's binding configuration to handle all requests to the assigned port.
	a. Open the applicationhost.config file found in the `.vs/config` folder of the solution's root directory.
	b. Find the `site` node with the name "SolutionForms.Client.Mvc" (search text: <site name="SolutionForms.Client.Mvc")
	c. Remove the "localhost" specification from the bindings child node. 
		* The original node looks like <binding protocol="http" bindingInformation="*:52794:localhost" />
		* After modifications the node looks like <binding protocol="http" bindingInformation="*:52794:" />
		* NOTE: Don't change the port number! Visual Studio may have issued a different port number. Keep the port number issued.
		
3. If IIS is currently running, stop it by right-clicking the icon in the task tray and clicking Exit.

> Final note: VS now has to be run as an Administrator otherwise the website won't start due to permissions errors.
>	Another option, rather than running VS as an admin, is to add the relevant urls to HTTP.sys as follows:
>	`netsh http add urlacl url=”http://test.localhost:52794/” user=everyone`