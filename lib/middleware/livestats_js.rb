require 'uri'

module Rack
  class Livestats
    def initialize(app)
      @app = app
    end

    def call(env)
      status, headers, response = @app.call(env)

      remote_ip = env['HTTP_X_FORWARDED_FOR'] || env["REMOTE_ADDR"]
      # remote_ip = '24.18.211.123'
      request_uri = URI.escape(env['REQUEST_URI'])
      livestats_server = 'localhost'
      livestats_port = '8000'

      js_snippet = <<-EOF
      <script type="text/javascript" defer="defer">
      var xmlHttp=null;try{xmlHttp=new XMLHttpRequest}catch(e)
      {try{xmlHttp=new ActiveXObject("Microsoft.XMLHTTP")}catch(e)
      {try{xmlHttp=new ActiveXObject("Msxml2.XMLHTTP")}catch(e)
      {xmlHttp=null}}}if(xmlHttp){xmlHttp.open("GET",
      "http://#{livestats_server}:#{livestats_port}/stat?ip=#{remote_ip}&title=#{request_uri}",true);
      xmlHttp.send(null)}
      </script>
      EOF

      if headers["Content-Type"] =~ /text\/html|application\/xhtml\+xml/
        body = ""
        response.each { |part| body << part }
        index = body.rindex("</body>")
        if index
          body.insert(index, js_snippet)
          headers["Content-Length"] = body.length.to_s
          response = [body]
        end
      end

      [status, headers, response]
    end
  end
end