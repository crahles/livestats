require 'net/http'
require 'uri'

module Rack
  class Livestats
    def initialize(app)
      @app = app
    end

    def call(env)
      status, headers, response = @app.call(env)

      begin
        remote_ip = env['HTTP_X_FORWARDED_FOR'] || env["REMOTE_ADDR"]
        # remote_ip = '24.18.211.123'
        request_uri = URI.escape(env['REQUEST_URI'])
        livestats_server = 'localhost'
        livestats_port = '8000'


        if ((headers["Content-Type"] =~ /text\/html|application\/xhtml\+xml/) && status == 200)
          Net::HTTP.get(livestats_server, "/stat?ip=#{remote_ip}&title=#{request_uri}", livestats_port)
        end
      rescue
      end

      [status, headers, response]
    end
  end
end